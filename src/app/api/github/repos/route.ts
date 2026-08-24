import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function getToken(userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("user_github_tokens").select("access_token").eq("user_id", userId).single();
  return data?.access_token ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken(session.user.id);
  if (!token) return NextResponse.json({ error: "GitHub nicht verbunden" }, { status: 403 });

  const owner = req.nextUrl.searchParams.get("owner");
  const type = req.nextUrl.searchParams.get("type") ?? "user";

  let apiUrl: string;
  if (!owner || type === "user") {
    apiUrl = "https://api.github.com/user/repos?per_page=100&sort=pushed&type=owner";
  } else {
    apiUrl = `https://api.github.com/orgs/${owner}/repos?per_page=100&sort=pushed&type=all`;
  }

  const res = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });

  if (!res.ok) return NextResponse.json({ error: "Fehler beim Laden der Repos" }, { status: res.status });

  const repos = await res.json();
  return NextResponse.json(
    repos.map((r: { id: number; name: string; full_name: string; private: boolean; default_branch: string; pushed_at: string }) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch,
      pushed_at: r.pushed_at,
    }))
  );
}
