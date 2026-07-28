import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function ownsProject(projectId: string, userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("projects").select("id").eq("id", projectId).eq("user_id", userId).single();
  return !!data;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ botId: string; tableName: string }> }) {
  const { botId, tableName } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sb = createAdminClient();
  const { data } = await sb
    .from("project_user_rows")
    .select("id,data,created_at")
    .eq("project_id", botId)
    .eq("table_name", tableName)
    .order("created_at", { ascending: true });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ botId: string; tableName: string }> }) {
  const { botId, tableName } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  if (!data || typeof data !== "object") return NextResponse.json({ error: "data required" }, { status: 400 });

  const sb = createAdminClient();
  const { data: row, error } = await sb
    .from("project_user_rows")
    .insert({ project_id: botId, table_name: tableName, data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ botId: string; tableName: string }> }) {
  const { botId, tableName } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = createAdminClient();
  await sb.from("project_user_rows").delete().eq("id", id).eq("project_id", botId).eq("table_name", tableName);

  return NextResponse.json({ ok: true });
}
