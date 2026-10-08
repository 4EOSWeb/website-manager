import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.EDITOR_PREVIEW !== "1") return NextResponse.next();
  const token = process.env.EDITOR_PREVIEW_TOKEN;
  if (token && request.headers.get("x-4eos-preview") === token) return NextResponse.next();
  return new NextResponse("This preview is private. Open it from the website editor.", {
    status: 401,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
