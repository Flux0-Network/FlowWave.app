import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.HOSTING_API_URL ?? "http://localhost:8000";
const API_SECRET = process.env.HOSTING_API_SECRET ?? "";

function headers() {
  return { "x-api-secret": API_SECRET, "Content-Type": "application/json" };
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const res = await fetch(`${API_URL}/bots/${botId}`, { method: "DELETE", headers: headers() });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;
  const res = await fetch(`${API_URL}/bots/${botId}/status`, { headers: headers() });
  return NextResponse.json(await res.json(), { status: res.status });
}
