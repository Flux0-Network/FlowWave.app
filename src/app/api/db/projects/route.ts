import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_CODE = `import discord
from discord.ext import commands
import os

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'Eingeloggt als {bot.user}')

@bot.command()
async def ping(ctx):
    await ctx.send('Pong!')

bot.run(os.environ['DISCORD_TOKEN'])
`;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("bots")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, clientId = "" } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const sb = createAdminClient();

  const { data: bot, error: botErr } = await sb
    .from("bots")
    .insert({ user_id: session.user.id, name, client_id: clientId, status: "stopped" })
    .select()
    .single();

  if (botErr) return NextResponse.json({ error: botErr.message }, { status: 500 });

  // seed default file
  await sb.from("project_files").insert({ bot_id: bot.id, name: "main.py", content: DEFAULT_CODE });

  return NextResponse.json(bot, { status: 201 });
}
