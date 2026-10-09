import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-4eos-path", request.nextUrl.pathname);
  if (process.env.EDITOR_PREVIEW === "1") {
    const token = process.env.EDITOR_PREVIEW_TOKEN;
    // next/image fetches its source with no headers, so it can never carry the token.
    // These folders are the site's own published pictures; editor uploads in /media stay gated.
    const publishedImage = request.method === "GET" && /^\/(brand|insights-images|team)\/[\w.-]+\.(png|jpe?g|webp|avif|gif|svg)$/i.test(request.nextUrl.pathname);
    if (!publishedImage && (!token || request.headers.get("x-4eos-preview") !== token)) {
      return new NextResponse("This preview is private. Open it from the website editor.", {
        status: 401,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
