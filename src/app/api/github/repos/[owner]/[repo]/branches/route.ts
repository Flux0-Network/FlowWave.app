import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function getToken(userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("user_github_tokens").select("access_token").eq("user_id", userId).single();
  return data?.access_token ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getToken(session.user.id);
  if (!token) return NextResponse.json({ error: "GitHub nicht verbunden" }, { status: 403 });

  const { owner, repo } = await params;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });

  if (!res.ok) return NextResponse.json({ error: "Fehler beim Laden der Branches" }, { status: res.status });

  const branches = await res.json();
  return NextResponse.json(
    branches.map((b: { name: string; protected: boolean }) => ({ name: b.name, protected: b.protected }))
  );
}
