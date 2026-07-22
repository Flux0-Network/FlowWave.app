"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileCode,
  ArrowLeft,
  Rocket,
  Save,
  Eye,
  EyeOff,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BotProject {
  id: string;
  name: string;
  clientId: string;
  status: string;
  createdAt: string;
  code: string;
}

const STORAGE_KEY = "cogsforge:bots";

function loadBots(): BotProject[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveBot(updated: BotProject) {
  const bots = loadBots().map((b) => (b.id === updated.id ? updated : b));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
}

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

const treeEntries = [
  { name: "my-bot", type: "folder", open: true, depth: 0 },
  { name: "bot.py", type: "file", active: true, depth: 1 },
  { name: "requirements.txt", type: "file", depth: 1 },
] as const;

export default function EditorPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = use(params);
  const router = useRouter();

  const [bot, setBot] = useState<BotProject | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState("");
  const [deploySuccess, setDeploySuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const found = loadBots().find((b) => b.id === botId);
    if (!found) { router.push("/projects"); return; }
    setBot(found);
    setCode(found.code ?? DEFAULT_CODE);
  }, [botId, router]);

  const handleSave = () => {
    if (!bot) return;
    const updated = { ...bot, code };
    saveBot(updated);
    setBot(updated);
    setSaved(true);
  };

  const handleDeploy = async () => {
    if (!bot || !token.trim()) { setDeployError("Token erforderlich."); return; }
    setDeploying(true);
    setDeployError("");
    setDeploySuccess(false);
    try {
      handleSave();
      const res = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: bot.id, code, token: token.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Deploy fehlgeschlagen.");
      }
      const bots = loadBots().map((b) =>
        b.id === bot.id ? { ...b, code, status: "running" } : b
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
      setBot((prev) => prev ? { ...prev, status: "running" } : prev);
      setDeploySuccess(true);
      setToken("");
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Deploy fehlgeschlagen.");
    } finally {
      setDeploying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = code.substring(0, start) + "    " + code.substring(end);
      setCode(next);
      setSaved(false);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  if (!bot) return null;

  return (
    <div className="flex flex-col h-screen bg-[oklch(0.07_0.014_258)] text-zinc-300 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-black/30 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
        >
          <ArrowLeft className="size-3" />
          Dashboard
        </Link>
        <span className="text-[11px] text-zinc-500 font-mono flex-1 text-center select-none">
          {bot.name} — bot.py
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", saved ? "text-zinc-600" : "text-amber-400/80 bg-amber-400/10")}>
            {saved ? "Gespeichert" : "Ungespeicherte Änderungen"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px] gap-1 text-zinc-400 hover:text-zinc-200"
            onClick={handleSave}
          >
            <Save className="size-3" />
            Speichern
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-white/8 bg-black/20 flex flex-col">
          <p className="px-3 py-2 text-[9px] text-zinc-600 font-semibold uppercase tracking-widest select-none">
            Explorer
          </p>
          {treeEntries.map((entry, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1 py-[4px] text-[12px] select-none cursor-default",
                "active" in entry && entry.active
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
              style={{ paddingLeft: `${8 + entry.depth * 12}px` }}
            >
              {entry.type === "folder" ? (
                entry.open ? (
                  <ChevronDown className="size-3 shrink-0 text-zinc-500" />
                ) : (
                  <ChevronRight className="size-3 shrink-0 text-zinc-500" />
                )
              ) : (
                <span className="w-3 shrink-0" />
              )}
              {entry.type === "folder" ? (
                <FolderOpen className="size-3.5 shrink-0 text-amber-400/70" />
              ) : (
                <FileCode className="size-3.5 shrink-0 text-blue-400/70" />
              )}
              <span className="truncate leading-none">{entry.name}</span>
            </div>
          ))}
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex border-b border-white/8 bg-black/10 shrink-0">
            <div className="flex items-center gap-1.5 px-4 py-1.5 border-r border-white/8 bg-white/5 text-[12px]">
              <FileCode className="size-3 text-blue-400/80" />
              <span className="text-zinc-300">bot.py</span>
            </div>
          </div>

          {/* Code textarea */}
          <div className="flex-1 relative min-h-0">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => { setCode(e.target.value); setSaved(false); setDeploySuccess(false); }}
              onKeyDown={handleKeyDown}
              className="absolute inset-0 w-full h-full bg-transparent text-zinc-200 font-mono text-[13px] leading-[1.75] p-4 resize-none focus:outline-none"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar — deploy */}
      <div className="shrink-0 border-t border-white/8 bg-black/40 px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 relative max-w-sm">
          <Input
            type={showToken ? "text" : "password"}
            placeholder="Bot Token — für Deploy"
            value={token}
            onChange={(e) => { setToken(e.target.value); setDeployError(""); setDeploySuccess(false); }}
            className="h-7 pr-8 font-mono text-[11px] bg-white/5 border-white/10 text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
          >
            {showToken ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          </button>
        </div>

        {deployError && (
          <div className="flex items-center gap-1.5 text-[11px] text-red-400">
            <AlertCircle className="size-3 shrink-0" />
            {deployError}
          </div>
        )}
        {deploySuccess && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="size-3 shrink-0" />
            Bot läuft!
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className={cn(
            "size-2 rounded-full",
            bot.status === "running" ? "bg-emerald-400" : "bg-zinc-600"
          )} />
          <span className="text-[11px] text-zinc-500">
            {bot.status === "running" ? "Online" : "Offline"}
          </span>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={handleDeploy}
            disabled={deploying}
          >
            {deploying ? (
              <>
                <RotateCcw className="size-3 animate-spin" />
                Deploying…
              </>
            ) : (
              <>
                <Rocket className="size-3" />
                Deployen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
