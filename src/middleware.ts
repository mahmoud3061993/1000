import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/products/plant")) {
    return NextResponse.next();
  }
  if (pathname.includes(".") && !pathname.endsWith(".html")) {
    return NextResponse.next();
  }
  if (pathname.endsWith("/index.html") || pathname.endsWith(".html")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  url.pathname = `${withSlash}index.html`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/products/plant", "/products/plant/:path*"],
};
