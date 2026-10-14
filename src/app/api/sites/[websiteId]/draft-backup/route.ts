import { authorize, authzResponse } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { backupDraft } from "@/platform/migrate/backup";

type Params = { params: Promise<{ websiteId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "draft.save");
    const home = await prisma.page.findUnique({ where: { websiteId_route: { websiteId, route: "/" } } });
    const draft = home
      ? await prisma.workspaceDraft.findUnique({
          where: { websiteId_userId_pageId: { websiteId, userId: actor.user.id, pageId: home.id } },
        })
      : null;
    if (!draft) return Response.json({ message: "That draft was not found." }, { status: 404 });
    const backupId = await backupDraft(draft.id);
    return Response.json({ backupId });
  } catch (error) {
    return authzResponse(error);
  }
}
