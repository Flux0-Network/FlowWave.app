import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ connected: false });

  const sb = createAdminClient();
  const { data } = await sb.from("user_github_tokens").select("scope").eq("user_id", session.user.id).single();
  if (!data) return NextResponse.json({ connected: false });
  return NextResponse.json({ connected: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createAdminClient();
  await sb.from("user_github_tokens").delete().eq("user_id", session.user.id);
  return NextResponse.json({ ok: true });
}
