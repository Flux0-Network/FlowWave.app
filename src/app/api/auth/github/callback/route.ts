import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/projects", req.url));

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/projects?github=error", req.url));

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/projects?github=error", req.url));
  }

  const sb = createAdminClient();
  await sb.from("user_github_tokens").upsert({
    user_id: session.user.id,
    access_token: tokenData.access_token,
    scope: tokenData.scope ?? "",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  const returnTo = req.nextUrl.searchParams.get("state")
    ? (() => {
        try {
          const s = JSON.parse(Buffer.from(req.nextUrl.searchParams.get("state")!, "base64url").toString());
          return s.returnTo ?? "/projects";
        } catch { return "/projects"; }
      })()
    : "/projects";

  return NextResponse.redirect(new URL(`${returnTo}?github=connected`, req.url));
}
