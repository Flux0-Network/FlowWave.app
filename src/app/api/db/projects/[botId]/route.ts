import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAuthorized(botId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401, userId: "" };
  const sb = createAdminClient();
  const { data } = await sb.from("projects").select("id").eq("id", botId).eq("user_id", session.user.id).single();
  if (!data) return { error: "Not found", status: 404, userId: "" };
  return { error: null, status: 200, userId: session.user.id };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("projects")
    .select("*, project_files(*)")
    .eq("id", botId)
    .eq("user_id", session.user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const { error, status } = await getAuthorized(botId);
  if (error) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const allowed = ["name", "client_id", "status"];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];

  const sb = createAdminClient();
  const { data, error: err } = await sb.from("projects").update(patch).eq("id", botId).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const { error, status } = await getAuthorized(botId);
  if (error) return NextResponse.json({ error }, { status });

  const sb = createAdminClient();
  const { error: err } = await sb.from("projects").delete().eq("id", botId);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
