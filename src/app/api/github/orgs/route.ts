import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function getToken(userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("user_github_tokens").select("access_token").eq("user_id", userId).single();
  return data?.access_token ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken(session.user.id);
  if (!token) return NextResponse.json({ error: "GitHub nicht verbunden" }, { status: 403 });

  const [userRes, orgsRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }),
    fetch("https://api.github.com/user/orgs?per_page=100", { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }),
  ]);

  const user = await userRes.json();
  const orgs = orgsRes.ok ? await orgsRes.json() : [];

  const accounts = [
    { login: user.login, avatar_url: user.avatar_url, type: "user" as const },
    ...orgs.map((o: { login: string; avatar_url: string }) => ({ login: o.login, avatar_url: o.avatar_url, type: "org" as const })),
  ];

  return NextResponse.json(accounts);
}
