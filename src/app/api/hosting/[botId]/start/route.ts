import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.HOSTING_API_URL ?? "http://localhost:8000";
const API_SECRET = process.env.HOSTING_API_SECRET ?? "";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const res = await fetch(`${API_URL}/bots/${botId}/start`, {
    method: "POST",
    headers: { "x-api-secret": API_SECRET },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
