import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.HOSTING_API_URL ?? "http://localhost:8000";
const API_SECRET = process.env.HOSTING_API_SECRET ?? "";

const h = () => ({ "x-api-secret": API_SECRET, "Content-Type": "application/json" });
const unavailable = () =>
  NextResponse.json({ detail: "Hosting-API nicht erreichbar." }, { status: 503 });

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  try {
    const res = await fetch(`${API_URL}/bots/${botId}`, { method: "DELETE", headers: h() });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return unavailable();
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  try {
    const res = await fetch(`${API_URL}/bots/${botId}/status`, { headers: h() });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ status: "stopped" }, { status: 200 });
  }
}
