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
  const { data } = await sb
    .from("project_deploys")
    .select("ts,ok,msg")
    .eq("bot_id", botId)
    .order("ts", { ascending: false })
    .limit(10);

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsBot(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ts, ok, msg = "" } = await req.json();
  if (ts === undefined || ok === undefined) return NextResponse.json({ error: "ts and ok required" }, { status: 400 });

  const sb = createAdminClient();
  await sb.from("project_deploys").insert({ bot_id: botId, ts, ok, msg });

  // keep only 10 most recent
  const { data: all } = await sb
    .from("project_deploys")
    .select("id,ts")
    .eq("bot_id", botId)
    .order("ts", { ascending: false });

  if (all && all.length > 10) {
    await sb.from("project_deploys").delete().in("id", all.slice(10).map((r) => r.id));
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
