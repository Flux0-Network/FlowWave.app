import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/projects";
  const state = Buffer.from(JSON.stringify({ userId: session.user.id, returnTo, ts: Date.now() })).toString("base64url");
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,read:org&state=${state}`;
  return NextResponse.redirect(url);
}
