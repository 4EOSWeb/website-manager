import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 30 * 60 * 1000;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set.");
  return value;
}

export function mintPreviewAccess(websiteId: string, userId: string) {
  const payload = Buffer.from(JSON.stringify({ w: websiteId, u: userId, e: Date.now() + TTL_MS })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readPreviewAccess(token: string, websiteId: string): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const actual = Buffer.from(sig);
  const check = Buffer.from(expected);
  if (actual.length !== check.length || !timingSafeEqual(actual, check)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { w?: string; u?: string; e?: number };
    if (data.w !== websiteId || !data.u || typeof data.e !== "number" || data.e < Date.now()) return null;
    return { userId: data.u };
  } catch {
    return null;
  }
}
