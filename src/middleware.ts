import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    "/projects/:path*",
    "/builder/:path*",
    "/generator/:path*",
    "/marketplace/:path*",
  ],
};
