import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function ownsProject(projectId: string, userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("projects").select("id").eq("id", projectId).eq("user_id", userId).single();
  return !!data;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sb = createAdminClient();
  const { data } = await sb.from("project_folders").select("path").eq("project_id", botId);
  return NextResponse.json((data ?? []).map((r) => r.path));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paths: string[] = await req.json();
  if (!Array.isArray(paths)) return NextResponse.json({ error: "expected array" }, { status: 400 });

  const sb = createAdminClient();
  await sb.from("project_folders").delete().eq("project_id", botId);
  if (paths.length > 0) {
    await sb.from("project_folders").insert(paths.map((p) => ({ project_id: botId, path: p })));
  }
  return NextResponse.json({ ok: true });
}
