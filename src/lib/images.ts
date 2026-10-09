export function sniffImage(bytes: Buffer): "png" | "jpg" | "webp" | null {
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

export function imageSize(bytes: Buffer): { width: number; height: number } | null {
  const kind = sniffImage(bytes);
  if (kind === "png" && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (kind === "jpg") {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1] ?? 0;
      const size = bytes.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      }
      offset += 2 + size;
    }
  }
  if (kind === "webp" && bytes.length > 30) {
    const format = bytes.subarray(12, 16).toString();
    if (format === "VP8X") {
      return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    }
    if (format === "VP8 " && bytes.length > 30) {
      return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    }
    if (format === "VP8L" && bytes.length > 25) {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

/** SVG is kept only after scripts and other active content are removed. */
export function sanitizeSvg(bytes: Buffer): Buffer | null {
  const text = bytes.toString("utf8");
  if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(text)) return null;
  if (text.length > 1_500_000) return null;
  const cleaned = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)[\s\S]*?>/gi, "")
    .replace(/\s(?:on[a-z]+|href|xlink:href)\s*=\s*("[\s\S]*?"|'[\s\S]*?'|[^\s>]+)/gi, (match) => {
      if (/javascript:|data:/i.test(match)) return "";
      if (/^\s(?:on[a-z]+)/i.test(match)) return "";
      return match;
    });
  if (/<script|javascript:|foreignObject|\son[a-z]+\s*=/i.test(cleaned)) return null;
  if (!/<svg[\s>]/i.test(cleaned)) return null;
  return Buffer.from(cleaned);
}
