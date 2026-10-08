import { notFound } from "next/navigation";
import { EditorShell } from "@/components/editor-shell";
import { AuthzError, authorize } from "@/lib/authorize";
import { blogDraftSchema, defaultBlogDraft, defaultHomeDraft, homeDraftSchema } from "@/lib/content-schema";
import { parseManifest } from "@/lib/manifest";
import { mintPreviewAccess } from "@/lib/preview-access";
import { prisma } from "@/lib/prisma";
import { can, permissionsFor, roleLabel } from "@/lib/roles";

export default async function EditorPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  let actor;
  try {
    actor = await authorize(websiteId, "view");
  } catch (error) {
    if (error instanceof AuthzError) notFound();
    throw error;
  }
  const page = await prisma.page.findUnique({ where: { websiteId_route: { websiteId, route: "/" } } });
    const draft = page
      ? await prisma.workspaceDraft.findUnique({
          where: { websiteId_userId_pageId: { websiteId, userId: actor.user.id, pageId: page.id } },
        })
      : null;
    const home = homeDraftSchema.safeParse(draft?.draftData);
    const post = await prisma.blogPost.findFirst({
      where: { websiteId, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
    });
    const blog = blogDraftSchema.safeParse(post?.content);
    const media = await prisma.mediaAsset.findMany({ where: { websiteId }, orderBy: { createdAt: "desc" } });
    const publications = await prisma.publishingRequest.findMany({
      where: { websiteId },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    const manifest = parseManifest(actor.website.manifest);
    const actions = permissionsFor(actor.platformRole, actor.membershipRole);
    return (
      <EditorShell
        websiteId={websiteId}
        websiteName={actor.website.name}
        routes={manifest.routes}
        initialHome={home.success ? home.data : defaultHomeDraft}
        initialBlog={blog.success ? blog.data : defaultBlogDraft}
        media={media.map((item) => ({ src: `/media/${item.filename}`, alt: item.altText, filename: item.filename }))}
        canEdit={can(actions, "edit")}
        canPublish={can(actions, "publish.request")}
        role={roleLabel(actor.platformRole, actor.membershipRole)}
        userName={actor.user.displayName}
        previewAccess={mintPreviewAccess(websiteId, actor.user.id)}
        publications={publications.map((item) => ({
          status: item.status,
          summary: item.summary,
          reviewUrl: item.pullRequestUrl,
        }))}
      />
    );
}
