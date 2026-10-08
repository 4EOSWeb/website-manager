import { authorize, authzResponse } from "@/lib/authorize";
import { blogDraftSchema, defaultHomeDraft, homeDraftSchema } from "@/lib/content-schema";
import { prisma } from "@/lib/prisma";
import { submitForPublish } from "@/lib/publish";

type Params = { params: Promise<{ websiteId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "publish.request");
    const page = await prisma.page.findUnique({ where: { websiteId_route: { websiteId, route: "/" } } });
    const draft = page
      ? await prisma.workspaceDraft.findFirst({
          where: { websiteId, pageId: page.id },
          orderBy: { updatedAt: "desc" },
        })
      : null;
    const home = homeDraftSchema.safeParse(draft?.draftData);
    const posts = await prisma.blogPost.findMany({ where: { websiteId, status: "DRAFT" } });
    const blog = posts.flatMap((post) => {
      const parsed = blogDraftSchema.safeParse(post.content);
      return parsed.success ? [parsed.data] : [];
    });
    const request = await submitForPublish({
      user: actor.user,
      website: actor.website,
      home: home.success ? home.data : defaultHomeDraft,
      posts: blog,
    });
    return Response.json({
      message: request.summary,
      status: request.status,
      branch: request.branchName,
      commit: request.commitSha,
      reviewUrl: request.pullRequestUrl,
    });
  } catch (error) {
    return authzResponse(error);
  }
}
