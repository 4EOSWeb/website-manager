import fs from "node:fs";
import path from "node:path";
import { authorize, authzResponse } from "@/lib/authorize";
import { recordAudit } from "@/lib/audit";
import { blogDraftSchema } from "@/lib/content-schema";
import { imageUsage } from "@/lib/editor-ops";
import { imageSize, mediaRoot, storeImage } from "@/lib/media";
import { normalizeSiteDraft } from "@/lib/page-documents";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ websiteId: string }> };

function contentType(filename: string) {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

async function usageFor(websiteId: string) {
  const drafts = await prisma.workspaceDraft.findMany({ where: { websiteId } });
  const posts = await prisma.blogPost.findMany({ where: { websiteId } });
  const blogs = posts.flatMap((post) => {
    const parsed = blogDraftSchema.safeParse(post.content);
    return parsed.success ? [parsed.data] : [];
  });
  const sites = drafts.map((draft) => normalizeSiteDraft(draft.draftData));
  return { sites, blogs };
}

export async function GET(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    await authorize(websiteId, "view");
    const name = new URL(request.url).searchParams.get("name");
    if (name) {
      if (!/^[\w.-]+$/.test(name)) return Response.json({ message: "That image is not available." }, { status: 400 });
      const file = path.join(mediaRoot(websiteId), name);
      if (!file.startsWith(mediaRoot(websiteId)) || !fs.existsSync(file)) {
        return Response.json({ message: "That image is not available." }, { status: 404 });
      }
      const bytes = fs.readFileSync(file);
      return new Response(bytes, {
        headers: { "content-type": contentType(name), "cache-control": "private, max-age=3600" },
      });
    }
    const media = await prisma.mediaAsset.findMany({ where: { websiteId }, orderBy: { createdAt: "desc" } });
    const { sites, blogs } = await usageFor(websiteId);
    return Response.json({
      media: media.map((item) => {
        const stored = path.join(mediaRoot(websiteId), item.filename);
        const bytes = fs.existsSync(stored) ? fs.readFileSync(stored) : Buffer.alloc(0);
        const size = imageSize(bytes);
        const usedBy = sites.flatMap((site) => imageUsage(site, blogs, item.filename));
        return {
          src: `/media/${item.filename}`,
          alt: item.altText,
          filename: item.filename,
          bytes: bytes.length,
          width: size?.width ?? null,
          height: size?.height ?? null,
          usedBy: [...new Set(usedBy)],
        };
      }),
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
    const stored = fs.readFileSync(path.join(mediaRoot(websiteId), saved.filename));
    const size = imageSize(stored);
    return Response.json({
      src: `/media/${saved.filename}`,
      alt: saved.altText,
      filename: saved.filename,
      bytes: stored.length,
      width: size?.width ?? null,
      height: size?.height ?? null,
      usedBy: [] as string[],
    });
  } catch (error) {
    if (error instanceof Error && /image|5 MB/.test(error.message)) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return authzResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    const actor = await authorize(websiteId, "media.upload");
    const body = (await request.json()) as { filename?: string };
    const filename = body.filename ?? "";
    if (!/^[\w.-]+$/.test(filename)) return Response.json({ message: "That image is not available." }, { status: 400 });
    const { sites, blogs } = await usageFor(websiteId);
    const usedBy = [...new Set(sites.flatMap((site) => imageUsage(site, blogs, filename)))];
    if (usedBy.length > 0) {
      return Response.json({ message: `This image is still used on ${usedBy.join(", ")}.` }, { status: 400 });
    }
    const asset = await prisma.mediaAsset.findFirst({ where: { websiteId, filename } });
    if (!asset) return Response.json({ message: "That image is not in the library." }, { status: 404 });
    const file = path.join(mediaRoot(websiteId), filename);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    await recordAudit({ websiteId, userId: actor.user.id, action: "media.upload", target: filename, metadata: { deleted: true } });
    return Response.json({ message: "Image removed from the library." });
  } catch (error) {
    return authzResponse(error);
  }
}
