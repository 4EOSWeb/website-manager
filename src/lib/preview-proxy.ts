const SITE_ASSET_PREFIX = "/site-assets";

export function previewAssetPath(requestPath: string) {
  const marker = `${SITE_ASSET_PREFIX}/`;
  const index = requestPath.indexOf(marker);
  if (index === -1) return requestPath;
  return `/_next/${requestPath.slice(index + marker.length)}`;
}

export function rewritePreviewBody(
  body: string,
  prefix: string,
  contentType: string,
  options?: { accessToken?: string; assetPath?: string },
) {
  const textual = contentType.includes("text/html") || contentType.includes("text/css") || contentType.includes("javascript");
  if (!textual) return body;
  let next = body
    .replaceAll('href="/', `href="${prefix}/`)
    .replaceAll('src="/', `src="${prefix}/`)
    .replaceAll('srcset="/', `srcset="${prefix}/`)
    .replaceAll('action="/', `action="${prefix}/`)
    .replaceAll("url(/", `url(${prefix}/`)
    .replaceAll('url("/', `url("${prefix}/`);
  next = next.replace(/\b(srcset|imagesrcset)="([^"]*)"/gi, (_, name: string, value: string) => {
    const candidates = value.split(/,\s+/).map((candidate) => (candidate.startsWith("/") && !candidate.startsWith(`${prefix}/`) ? `${prefix}${candidate}` : candidate));
    return `${name}="${candidates.join(", ")}"`;
  });
  if (contentType.includes("text/css") && options?.assetPath) {
    next = absolutizeCss(next, options.assetPath);
  }
  next = next.replaceAll(`${prefix}/_next/`, `${prefix}${SITE_ASSET_PREFIX}/`);
  if (contentType.includes("text/html")) next = allowCrossOriginAssets(next);
  if (options?.accessToken) next = stampAccess(next, prefix, options.accessToken);
  return next;
}

function allowCrossOriginAssets(html: string) {
  return html
    .replaceAll('<link rel="stylesheet"', '<link rel="stylesheet" crossorigin="anonymous"')
    .replaceAll("<script", '<script crossorigin="anonymous"');
}

function absolutizeCss(css: string, assetPath: string) {
  const base = `http://preview.local${assetPath}`;
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (full, quote: string, raw: string) => {
    const value = raw.trim();
    if (value.startsWith("data:") || value.startsWith("http:") || value.startsWith("https:") || value.startsWith("//")) return full;
    const pathname = value.startsWith("/") ? value : new URL(value, base).pathname;
    const q = quote || '"';
    return `url(${q}${pathname}${q})`;
  });
}

function stampAccess(body: string, prefix: string, token: string) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokenQuery = `t=${encodeURIComponent(token)}`;
  return body.replace(new RegExp(`${escaped}/[^"'\\s)\\\\]*`, "g"), (match) => {
    if (/[?&]t=/.test(match)) return match;
    return `${match}${match.includes("?") ? "&" : "?"}${tokenQuery}`;
  });
}
