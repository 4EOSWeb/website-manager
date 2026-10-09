import { notFound } from "next/navigation";
import { EditorShell } from "@/components/editor-shell";
import "@/components/editor/editor.css";
import { AuthzError, authorize } from "@/lib/authorize";
import { blogDraftSchema } from "@/lib/content-schema";
import { imageSize, mediaRoot } from "@/lib/media";
import { normalizeSiteDraft } from "@/lib/page-documents";
import { mintPreviewAccess } from "@/lib/preview-access";
import { prisma } from "@/lib/prisma";
import { syncDraftToWorkspace } from "@/lib/publish";
import { can, permissionsFor, roleLabel } from "@/lib/roles";
import fs from "node:fs";
import path from "node:path";

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
  const site = normalizeSiteDraft(draft?.draftData);
  const storedPosts = await prisma.blogPost.findMany({
    where: { websiteId, status: { in: ["DRAFT", "SCHEDULED"] } },
    orderBy: { updatedAt: "desc" },
  });
  const posts = storedPosts.flatMap((post) => {
    const parsed = blogDraftSchema.safeParse(post.content);
    return parsed.success ? [parsed.data] : [];
  });
  await syncDraftToWorkspace(websiteId, site, posts);
  const media = await prisma.mediaAsset.findMany({ where: { websiteId }, orderBy: { createdAt: "desc" } });
  const publications = await prisma.publishingRequest.findMany({
    where: { websiteId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const actions = permissionsFor(actor.platformRole, actor.membershipRole);
  const canEmbed = actor.platformRole === "SUPER_ADMIN" || actor.platformRole === "DESIGNER" || actor.membershipRole === "DESIGNER";
  return (
    <EditorShell
      websiteId={websiteId}
      websiteName={actor.website.name}
      initialSite={site}
      initialPosts={posts.length > 0 ? posts : []}
      media={media.map((item) => {
        const stored = path.join(mediaRoot(websiteId), item.filename);
        const bytes = fs.existsSync(stored) ? fs.readFileSync(stored) : Buffer.alloc(0);
        const size = imageSize(bytes);
        return {
          src: `/media/${item.filename}`,
          alt: item.altText,
          filename: item.filename,
          bytes: bytes.length,
          width: size?.width ?? null,
          height: size?.height ?? null,
          usedBy: [] as string[],
        };
      })}
      canEdit={can(actions, "edit")}
      canPublish={can(actions, "publish.request")}
      canEmbed={canEmbed}
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
