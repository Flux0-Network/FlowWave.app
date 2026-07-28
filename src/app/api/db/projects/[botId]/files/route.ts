import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function ownsProject(botId: string, userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("projects").select("id").eq("id", botId).eq("user_id", userId).single();
  return !!data;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sb = createAdminClient();
  const { data, error } = await sb.from("project_files").select("name,content").eq("project_id", botId).order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** PUT replaces all files for the project (upsert by name). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const files: { name: string; content: string }[] = await req.json();
  if (!Array.isArray(files)) return NextResponse.json({ error: "expected array" }, { status: 400 });

  const sb = createAdminClient();
  const now = new Date().toISOString();
  const rows = files.map((f) => ({ project_id: botId, name: f.name, content: f.content, updated_at: now }));

  // delete removed files, upsert existing/new
  const names = files.map((f) => f.name);
  await sb.from("project_files").delete().eq("project_id", botId).not("name", "in", `(${names.map((n) => `"${n}"`).join(",")})`);
  const { error } = await sb.from("project_files").upsert(rows, { onConflict: "project_id,name" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // update project updated_at
  await sb.from("projects").update({ updated_at: now }).eq("id", botId);
  return NextResponse.json({ ok: true });
}
