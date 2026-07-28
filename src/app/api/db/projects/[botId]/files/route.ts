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
  const { data, error } = await sb.from("project_files").select("name,content").eq("bot_id", botId).order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsBot(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const files: { name: string; content: string }[] = await req.json();
  if (!Array.isArray(files)) return NextResponse.json({ error: "expected array" }, { status: 400 });

  const sb = createAdminClient();
  const now = new Date().toISOString();
  const names = files.map((f) => f.name);

  if (names.length > 0) {
    await sb.from("project_files").delete().eq("bot_id", botId).not("name", "in", `(${names.map((n) => `"${n}"`).join(",")})`);
  } else {
    await sb.from("project_files").delete().eq("bot_id", botId);
  }

  if (files.length > 0) {
    const rows = files.map((f) => ({ bot_id: botId, name: f.name, content: f.content, updated_at: now }));
    const { error } = await sb.from("project_files").upsert(rows, { onConflict: "bot_id,name" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
