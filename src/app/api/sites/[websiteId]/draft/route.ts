import { authorize, authzResponse } from "@/lib/authorize";
import { recordAudit } from "@/lib/audit";
import { blogDraftSchema } from "@/lib/content-schema";
import { dropSaveData, readDraftPut } from "@/lib/draft-put";
import { normalizeSiteDraft, stripEmbeds } from "@/lib/page-documents";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { syncDraftToWorkspace } from "@/lib/publish";
import { randomBytes } from "node:crypto";

type Params = { params: Promise<{ websiteId: string }> };

function canEmbed(platformRole: string | null, membershipRole: string | null) {
  return platformRole === "SUPER_ADMIN" || platformRole === "DESIGNER" || membershipRole === "DESIGNER";
}

export async function PUT(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "draft.save");
    const parsed = readDraftPut(websiteId, await request.json());
    if (!parsed.ok) return Response.json({ message: parsed.message }, { status: parsed.status });
    const site = stripEmbeds(normalizeSiteDraft(parsed.site), canEmbed(actor.platformRole, actor.membershipRole));
    // A version 3 save always writes draft_data. visual_document stays until step 19.25 when this request omits it.
    const saved = dropSaveData(site, parsed.visualDocument);
    const update = saved.visualDocument === undefined
      ? { draftData: site }
      : { draftData: site, visualDocument: saved.visualDocument as Prisma.InputJsonValue };
    const home = await prisma.page.findUnique({ where: { websiteId_route: { websiteId, route: "/" } } });
    await prisma.workspaceDraft.upsert({
      where: {
        websiteId_userId_pageId: { websiteId, userId: actor.user.id, pageId: home?.id ?? "" },
      },
      create: {
        id: `draft_${randomBytes(6).toString("hex")}`,
        websiteId,
        userId: actor.user.id,
        pageId: home?.id,
        draftData: site,
        ...(saved.visualDocument === undefined ? {} : { visualDocument: saved.visualDocument as Prisma.InputJsonValue }),
      },
      update,
    });
    for (const page of site.pages) {
      if (page.route === "/") continue;
      const existing = await prisma.page.findFirst({ where: { id: page.id, websiteId } });
      if (existing) {
        if (existing.route !== page.route || existing.title !== page.title) {
          await prisma.page.update({ where: { id: page.id }, data: { route: page.route, title: page.title } });
        }
        continue;
      }
      await prisma.page.upsert({
        where: { websiteId_route: { websiteId, route: page.route } },
        create: {
          id: page.id,
          websiteId,
          route: page.route,
          title: page.title,
          editableManifest: {},
        },
        update: { title: page.title },
      });
    }
    const posts = await prisma.blogPost.findMany({ where: { websiteId, status: { in: ["DRAFT", "SCHEDULED"] } } });
    const blogs = posts.flatMap((post) => {
      const content = blogDraftSchema.safeParse(post.content);
      return content.success ? [content.data] : [];
    });
    await syncDraftToWorkspace(websiteId, site, blogs);
    await recordAudit({
      websiteId,
      userId: actor.user.id,
      action: "draft.save",
      target: "/",
    });
    return Response.json({ message: "Draft saved.", savedAt: new Date().toISOString() });
  } catch (error) {
    return authzResponse(error);
  }
}
