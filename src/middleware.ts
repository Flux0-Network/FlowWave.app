import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" && req.auth) {
    return NextResponse.redirect(new URL("/projects", req.url));
  }

  if (!req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/projects/:path*",
    "/builder/:path*",
    "/generator/:path*",
    "/marketplace/:path*",
    "/login",
  ],
};
