import { randomBytes } from "node:crypto";
import { authorize, authzResponse } from "@/lib/authorize";
import { normalizeSiteDraft } from "@/lib/page-documents";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ websiteId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    await authorize(websiteId, "view");
    const revisions = await prisma.editorRevision.findMany({
      where: { websiteId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, user: { select: { displayName: true } } },
    });
    return Response.json({ revisions });
  } catch (error) {
    return authzResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "draft.save");
    const site = normalizeSiteDraft(await request.json());
    const revision = await prisma.editorRevision.create({
      data: {
        id: `rev_${randomBytes(6).toString("hex")}`,
        websiteId,
        userId: actor.user.id,
        snapshot: site,
      },
    });
    const older = await prisma.editorRevision.findMany({
      where: { websiteId },
      orderBy: { createdAt: "desc" },
      skip: 20,
      select: { id: true },
    });
    if (older.length > 0) await prisma.editorRevision.deleteMany({ where: { id: { in: older.map((item) => item.id) } } });
    return Response.json({ id: revision.id });
  } catch (error) {
    return authzResponse(error);
  }
}
