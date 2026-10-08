import { AuthzError, authorize, authzResponse } from "@/lib/authorize";
import { readPreviewAccess } from "@/lib/preview-access";
import { previewAssetPath, rewritePreviewBody } from "@/lib/preview-proxy";
import { prisma } from "@/lib/prisma";
import { can, permissionsFor } from "@/lib/roles";
import { startPreview } from "@/lib/workspace";

type Params = { params: Promise<{ websiteId: string; path?: string[] }> };

async function allowPreview(websiteId: string, request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  try {
    await authorize(websiteId, "view");
    return token;
  } catch (error) {
    if (!(error instanceof AuthzError) || error.status !== 401 || !token) throw error;
  }
  const access = readPreviewAccess(token, websiteId);
  if (!access) throw new AuthzError(401, "Please sign in again.");
  const [user, website, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: access.userId } }),
    prisma.website.findUnique({ where: { id: websiteId } }),
    prisma.websiteMembership.findUnique({ where: { userId_websiteId: { userId: access.userId, websiteId } } }),
  ]);
  if (!user || user.status !== "ACTIVE") throw new AuthzError(401, "Please sign in again.");
  if (!website || website.editorStatus === "DISABLED") throw new AuthzError(404, "That website is not available.");
  const allowed = user.platformRole === "SUPER_ADMIN" || Boolean(membership);
  if (!allowed || (website.editorStatus !== "APPROVED" && user.platformRole !== "SUPER_ADMIN")) {
    throw new AuthzError(404, "That website is not available.");
  }
  if (!can(permissionsFor(user.platformRole, membership?.role ?? null), "view")) {
    throw new AuthzError(404, "That website is not available.");
  }
  return token;
}

async function proxy(request: Request, { params }: Params) {
  const { websiteId, path = [] } = await params;
  try {
    const accessToken = await allowPreview(websiteId, request);
    const preview = await startPreview(websiteId);
    const incoming = new URL(request.url);
    const targetPath = previewAssetPath(`/${path.join("/")}`);
    const target = new URL(targetPath, `http://127.0.0.1:${preview.port}`);
    const upstream = new URLSearchParams(incoming.search);
    upstream.delete("t");
    upstream.delete("v");
    target.search = upstream.toString() ? `?${upstream.toString()}` : "";
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    headers.set("x-4eos-preview", preview.token);
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
    });
    const prefix = `/preview/${websiteId}`;
    const responseType = response.headers.get("content-type") ?? "";
    const out = new Headers();
    // The preview frame is a unique origin, so styles and fonts only apply when this response is readable.
    out.set("access-control-allow-origin", "*");
    out.set("cross-origin-resource-policy", "cross-origin");
    const passthrough = ["content-type", "cache-control", "location", "etag"];
    for (const name of passthrough) {
      const value = response.headers.get(name);
      if (!value) continue;
      out.set(name, name === "location" && value.startsWith("/") ? `${prefix}${value}` : value);
    }
    if (responseType.includes("text/") || responseType.includes("javascript") || responseType.includes("json")) {
      const text = rewritePreviewBody(await response.text(), prefix, responseType, {
        accessToken,
        assetPath: incoming.pathname,
      });
      return new Response(text, { status: response.status, headers: out });
    }
    return new Response(await response.arrayBuffer(), { status: response.status, headers: out });
  } catch (error) {
    return authzResponse(error);
  }
}

export const GET = proxy;
export const POST = proxy;
export const HEAD = proxy;
