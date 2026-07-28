import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function ownsBot(botId: string, userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("bots").select("id").eq("id", botId).eq("user_id", userId).single();
  return !!data;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsBot(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sb = createAdminClient();
  const { data } = await sb.from("project_env_vars").select("key,value,hidden").eq("bot_id", botId).order("key");
  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsBot(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const vars: { key: string; value: string; hidden: boolean }[] = await req.json();
  if (!Array.isArray(vars)) return NextResponse.json({ error: "expected array" }, { status: 400 });

  const sb = createAdminClient();
  await sb.from("project_env_vars").delete().eq("bot_id", botId);
  if (vars.length > 0) {
    await sb.from("project_env_vars").insert(vars.map((v) => ({ bot_id: botId, key: v.key, value: v.value, hidden: v.hidden })));
  }
  return NextResponse.json({ ok: true });
}
