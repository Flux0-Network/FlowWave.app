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
  const { data } = await sb.from("project_connections").select("url,anon_key,service_key").eq("bot_id", botId).single();
  if (!data) return NextResponse.json(null);
  return NextResponse.json({ url: data.url, anonKey: data.anon_key, serviceKey: data.service_key || undefined });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsBot(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { url, anonKey, serviceKey = "" } = await req.json();
  if (!url || !anonKey) return NextResponse.json({ error: "url and anonKey required" }, { status: 400 });

  const sb = createAdminClient();
  await sb.from("project_connections").upsert(
    { bot_id: botId, url, anon_key: anonKey, service_key: serviceKey },
    { onConflict: "bot_id" }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsBot(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sb = createAdminClient();
  await sb.from("project_connections").delete().eq("bot_id", botId);
  return NextResponse.json({ ok: true });
}
