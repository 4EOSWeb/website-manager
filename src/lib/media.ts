import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { imageSize, sanitizeSvg, sniffImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 5_000_000;

export { imageSize, sniffImage };

export function mediaRoot(websiteId: string) {
  if (!/^[a-z0-9_-]+$/i.test(websiteId)) throw new Error("Unknown website.");
  return path.join(process.cwd(), "data", "media", websiteId);
}

export async function storeImage(options: { websiteId: string; userId: string; bytes: Buffer; altText: string }) {
  if (options.bytes.length === 0 || options.bytes.length > MAX_BYTES) {
    throw new Error("Use an image smaller than 5 MB.");
  }
  const raster = sniffImage(options.bytes);
  const svg = raster ? null : sanitizeSvg(options.bytes);
  const kind = raster ?? (svg ? "svg" : null);
  const bytes = svg ?? options.bytes;
  if (!kind) throw new Error("Use a PNG, JPEG, WebP, or SVG image.");
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const existing = await prisma.mediaAsset.findUnique({
    where: { websiteId_checksum: { websiteId: options.websiteId, checksum } },
  });
  if (existing) {
    if (options.altText && options.altText !== existing.altText) {
      return prisma.mediaAsset.update({ where: { id: existing.id }, data: { altText: options.altText } });
    }
    return existing;
  }
  const filename = `${checksum.slice(0, 16)}.${kind}`;
  const root = mediaRoot(options.websiteId);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, filename), bytes);
  return prisma.mediaAsset.create({
    data: {
      id: `media_${randomBytes(6).toString("hex")}`,
      websiteId: options.websiteId,
      filename,
      storageLocation: `public/media/${filename}`,
      altText: options.altText,
      checksum,
      uploadedById: options.userId,
    },
  });
}
