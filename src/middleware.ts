import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED = ["/projects", "/builder", "/generator", "/marketplace"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" && req.auth) {
    return NextResponse.redirect(new URL("/projects", req.url));
  }

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
