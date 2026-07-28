import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function ownsProject(projectId: string, userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("projects").select("id").eq("id", projectId).eq("user_id", userId).single();
  return !!data;
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ botId: string; tableName: string }> }) {
  const { botId, tableName } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await ownsProject(botId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sb = createAdminClient();
  await sb.from("project_user_rows").delete().eq("project_id", botId).eq("table_name", tableName);
  await sb.from("project_user_tables").delete().eq("project_id", botId).eq("name", tableName);

  return NextResponse.json({ ok: true });
}
