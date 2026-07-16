import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.HOSTING_API_URL ?? "http://localhost:8000";
const API_SECRET = process.env.HOSTING_API_SECRET ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const tail = req.nextUrl.searchParams.get("tail") ?? "100";
  try {
    const res = await fetch(`${API_URL}/bots/${botId}/logs?tail=${tail}`, {
      headers: { "x-api-secret": API_SECRET },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ logs: [] }, { status: 200 });
  }
}
