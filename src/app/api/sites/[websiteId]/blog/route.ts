import { randomBytes } from "node:crypto";
import { authorize, authzResponse } from "@/lib/authorize";
import { recordAudit } from "@/lib/audit";
import { blogDraftSchema, homeDraftSchema, zodFieldErrors, defaultHomeDraft } from "@/lib/content-schema";
import { prisma } from "@/lib/prisma";
import { syncDraftToWorkspace } from "@/lib/publish";

type Params = { params: Promise<{ websiteId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "blog.draft");
    const parsed = blogDraftSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ message: zodFieldErrors(parsed.error) }, { status: 400 });
    }
    const existing = await prisma.blogPost.findUnique({
      where: { websiteId_slug: { websiteId, slug: parsed.data.slug } },
    });
    const saved = existing
      ? await prisma.blogPost.update({
          where: { id: existing.id },
          data: {
            title: parsed.data.title,
            excerpt: parsed.data.excerpt,
            content: parsed.data,
            featuredImage: parsed.data.featuredImage?.src ?? null,
            authorDisplayName: parsed.data.authorDisplayName,
            seoTitle: parsed.data.seoTitle,
            metaDescription: parsed.data.metaDescription,
            status: "DRAFT",
          },
        })
      : await prisma.blogPost.create({
          data: {
            id: `post_${randomBytes(6).toString("hex")}`,
            websiteId,
            title: parsed.data.title,
            slug: parsed.data.slug,
            excerpt: parsed.data.excerpt,
            content: parsed.data,
            featuredImage: parsed.data.featuredImage?.src ?? null,
            authorDisplayName: parsed.data.authorDisplayName,
            authorUserId: actor.user.id,
            seoTitle: parsed.data.seoTitle,
            metaDescription: parsed.data.metaDescription,
            status: "DRAFT",
          },
        });
    const page = await prisma.page.findUnique({ where: { websiteId_route: { websiteId, route: "/" } } });
    const draft = page
      ? await prisma.workspaceDraft.findUnique({
          where: { websiteId_userId_pageId: { websiteId, userId: actor.user.id, pageId: page.id } },
        })
      : null;
    const home = homeDraftSchema.safeParse(draft?.draftData);
    const posts = await prisma.blogPost.findMany({ where: { websiteId, status: "DRAFT" } });
    await syncDraftToWorkspace(
      websiteId,
      home.success ? home.data : defaultHomeDraft,
      posts.map((post) => post.content as never),
    );
    await recordAudit({
      websiteId,
      userId: actor.user.id,
      action: "blog.draft",
      target: saved.slug,
    });
    return Response.json({ message: "Insights draft saved.", slug: saved.slug });
  } catch (error) {
    return authzResponse(error);
  }
}
