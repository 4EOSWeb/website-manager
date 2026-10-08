import { authorize, authzResponse } from "@/lib/authorize";
import { recordAudit } from "@/lib/audit";
import { homeDraftSchema, zodFieldErrors } from "@/lib/content-schema";
import { prisma } from "@/lib/prisma";
import { syncDraftToWorkspace } from "@/lib/publish";
import { randomBytes } from "node:crypto";

type Params = { params: Promise<{ websiteId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "draft.save");
    const parsed = homeDraftSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ message: zodFieldErrors(parsed.error) }, { status: 400 });
    }
    const page = await prisma.page.findUnique({ where: { websiteId_route: { websiteId, route: "/" } } });
    await prisma.workspaceDraft.upsert({
      where: {
        websiteId_userId_pageId: { websiteId, userId: actor.user.id, pageId: page?.id ?? "" },
      },
      create: {
        id: `draft_${randomBytes(6).toString("hex")}`,
        websiteId,
        userId: actor.user.id,
        pageId: page?.id,
        draftData: parsed.data,
      },
      update: { draftData: parsed.data },
    });
    const posts = await prisma.blogPost.findMany({ where: { websiteId, status: "DRAFT" } });
    await syncDraftToWorkspace(
      websiteId,
      parsed.data,
      posts.map((post) => post.content as never),
    );
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
