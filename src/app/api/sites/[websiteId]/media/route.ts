import { authorize, authzResponse } from "@/lib/authorize";
import { recordAudit } from "@/lib/audit";
import { storeImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ websiteId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    await authorize(websiteId, "view");
    const media = await prisma.mediaAsset.findMany({
      where: { websiteId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({
      media: media.map((item) => ({ src: `/media/${item.filename}`, alt: item.altText, filename: item.filename })),
    });
  } catch (error) {
    return authzResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "media.upload");
    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "");
    if (!(file instanceof File)) {
      return Response.json({ message: "Choose an image to upload." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await storeImage({ websiteId, userId: actor.user.id, bytes, altText: alt });
    await recordAudit({
      websiteId,
      userId: actor.user.id,
      action: "media.upload",
      target: saved.filename,
    });
    return Response.json({ src: `/media/${saved.filename}`, alt: saved.altText, filename: saved.filename });
  } catch (error) {
    if (error instanceof Error && /image|5 MB/.test(error.message)) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return authzResponse(error);
  }
}
