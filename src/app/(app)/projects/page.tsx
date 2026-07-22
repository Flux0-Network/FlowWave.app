"use client";

import {
  Plus,
  Activity,
  Server,
  Zap,
  RotateCcw,
  Square,
  Play,
  Terminal,
  FolderOpen,
  Bot,
  Trash2,
  AlertCircle,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
// Label/DialogDescription/DialogClose used in NewBotDialog
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type BotStatus = "running" | "stopped" | "error";

interface BotProject {
  id: string;
  name: string;
  clientId: string;
  status: BotStatus;
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

function saveBots(bots: BotProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function mapDockerStatus(s: string): BotStatus {
  if (s === "running" || s === "restarting") return "running";
  if (s === "dead") return "error";
  return "stopped";
}

const DEFAULT_BOT_CODE = `import discord
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

const STATUS_DOT: Record<BotStatus, string> = {
  running: "bg-emerald-400",
  stopped: "bg-zinc-500",
  error: "bg-red-500",
};
const STATUS_LABEL: Record<BotStatus, string> = {
  running: "Online",
  stopped: "Offline",
  error: "Fehler",
};
const STATUS_TEXT: Record<BotStatus, string> = {
  running: "text-emerald-400",
  stopped: "text-zinc-400",
  error: "text-red-400",
};

const ACTION_LABEL: Record<string, string> = {
  deploying: "Deploying",
  stopping: "Stopping",
  starting: "Starting",
  restarting: "Restarting",
  deleting: "Deleting",
};

function StatusDot({ status }: { status: BotStatus }) {
  return (
    <span className="relative flex size-2 shrink-0">
      {status === "running" && (
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-60",
            STATUS_DOT[status]
          )}
        />
      )}
      <span className={cn("relative inline-flex rounded-full size-2", STATUS_DOT[status])} />
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-start gap-4">
      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function LogsDialog({ botId, botName }: { botId: string; botName: string }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/hosting/${botId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLines(data.logs ?? []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {}
  }, [botId]);

  useEffect(() => {
    if (!open) {
      clearInterval(intervalRef.current);
      setLines([]);
      return;
    }
    setLoading(true);
    fetchLogs().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchLogs, 3000);
    return () => clearInterval(intervalRef.current);
  }, [open, fetchLogs]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Logs anzeigen"
          >
            <Terminal className="size-3.5" />
          </Button>
        }
      />
      <DialogContent className="max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{botName} — Logs</DialogTitle>
          <DialogDescription className="text-[11px]">
            Letzte 100 Zeilen · Aktualisiert alle 3s
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-zinc-950 dark:bg-black border border-border overflow-y-auto max-h-80 p-3 font-mono text-[11px] leading-relaxed">
          {loading && lines.length === 0 ? (
            <span className="text-zinc-500">Lade Logs…</span>
          ) : lines.length === 0 ? (
            <span className="text-zinc-500">Keine Logs verfügbar.</span>
          ) : (
            lines.map((l, i) => (
              <div key={i} className="text-zinc-300 whitespace-pre-wrap break-all">
                {l}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}


function BotCard({
  bot,
  actionState,
  onStart,
  onStop,
  onRestart,
  onDelete,
}: {
  bot: BotProject;
  actionState: string;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const busy = actionState !== "idle";
  const statusLabel =
    busy && ACTION_LABEL[actionState]
      ? `${ACTION_LABEL[actionState]}…`
      : STATUS_LABEL[bot.status];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={bot.status} />
          <span className="font-medium text-sm truncate">{bot.name}</span>
        </div>
        <span
          className={cn(
            "text-[11px] font-medium shrink-0",
            busy ? "text-muted-foreground" : STATUS_TEXT[bot.status]
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="px-4 py-3 text-[11px] text-muted-foreground space-y-1">
        {bot.clientId && (
          <div className="flex justify-between">
            <span>Client ID</span>
            <span className="text-foreground/60 font-mono">{bot.clientId.slice(0, 8)}…</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Erstellt</span>
          <span className="text-foreground/70">{formatDate(bot.createdAt)}</span>
        </div>
        {bot.status === "error" && (
          <div className="flex items-center gap-1.5 text-red-400 pt-0.5">
            <AlertCircle className="size-3 shrink-0" />
            <span>Bot abgestürzt oder konnte nicht starten</span>
          </div>
        )}
      </div>

      <div className="px-3 pb-3 flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground flex-1"
          onClick={() => (bot.status === "running" ? onStop(bot.id) : onStart(bot.id))}
          disabled={busy || bot.status === "stopped"}
        >
          {bot.status === "running" ? (
            <>
              <Square className="size-3" />
              Stop
            </>
          ) : (
            <>
              <Play className="size-3" />
              Start
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => onRestart(bot.id)}
          disabled={busy || bot.status !== "running"}
          title="Neu starten"
        >
          <RotateCcw className="size-3.5" />
        </Button>
        <Link href={`/projects/${bot.id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Code bearbeiten"
          >
            <Code2 className="size-3.5" />
          </Button>
        </Link>
        <LogsDialog botId={bot.id} botName={bot.name} />
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(bot.id)}
          disabled={busy}
          title="Bot löschen"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function NewBotDialog({ onAdd }: { onAdd: (name: string, clientId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = () => {
    const e: { name?: string } = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Mindestens 2 Zeichen.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onAdd(name.trim(), clientId.trim());
    setName("");
    setClientId("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5 shrink-0">
            <Plus className="size-3.5" />
            Neues Projekt
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Neuer Discord Bot</DialogTitle>
              <DialogDescription className="mt-0.5">
                Füge deinen Bot hinzu und bearbeite den Code im Editor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="bot-name" className="text-[12px] font-medium">
              Bot Name
            </Label>
            <Input
              id="bot-name"
              placeholder="z.B. ModerationBot"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({});
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bot-client-id" className="text-[12px] font-medium">
              Application ID
              <span className="ml-1.5 text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="bot-client-id"
              placeholder="1234567890123456789"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="font-mono text-[12px]"
            />
          </div>
        </div>

        <div className="-mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3">
          <DialogClose render={<Button variant="ghost" size="sm">Abbrechen</Button>} />
          <Button size="sm" className="gap-1.5" onClick={handleSubmit}>
            <Bot className="size-3.5" />
            Bot hinzufügen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const [bots, _setBots] = useState<BotProject[]>([]);
  const [actionStates, setActionStates] = useState<Record<string, string>>({});
  const botsRef = useRef<BotProject[]>([]);

  const update = useCallback((next: BotProject[]) => {
    botsRef.current = next;
    _setBots(next);
    saveBots(next);
  }, []);

  const setAction = (id: string, action: string) =>
    setActionStates((prev) => ({ ...prev, [id]: action }));

  useEffect(() => {
    const loaded = loadBots().map((b) => ({
      ...b,
      code: b.code ?? DEFAULT_BOT_CODE,
    }));
    botsRef.current = loaded;
    _setBots(loaded);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const running = botsRef.current.filter((b) => b.status === "running");
      if (running.length === 0) return;
      const results = await Promise.all(
        running.map(async (b) => {
          try {
            const res = await fetch(`/api/hosting/${b.id}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { id: b.id, status: mapDockerStatus(data.status) };
          } catch {
            return null;
          }
        })
      );
      const changes = results.filter(Boolean) as { id: string; status: BotStatus }[];
      const needsUpdate = changes.some(({ id, status }) => {
        const bot = botsRef.current.find((b) => b.id === id);
        return bot && bot.status !== status;
      });
      if (needsUpdate) {
        const next = botsRef.current.map((b) => {
          const c = changes.find((x) => x.id === b.id);
          return c ? { ...b, status: c.status } : b;
        });
        update(next);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [update]);

  const handleAdd = (name: string, clientId: string) => {
    const bot: BotProject = {
      id: crypto.randomUUID(),
      name,
      clientId,
      status: "stopped",
      createdAt: new Date().toISOString(),
      code: DEFAULT_BOT_CODE,
    };
    update([bot, ...botsRef.current]);
  };

  const handleStart = async (id: string) => {
    setAction(id, "starting");
    try {
      const res = await fetch(`/api/hosting/${id}/start`, { method: "POST" });
      const status: BotStatus = res.ok ? "running" : "error";
      update(botsRef.current.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch {
      update(botsRef.current.map((b) => (b.id === id ? { ...b, status: "error" } : b)));
    } finally {
      setAction(id, "idle");
    }
  };

  const handleStop = async (id: string) => {
    setAction(id, "stopping");
    try {
      const res = await fetch(`/api/hosting/${id}/stop`, { method: "POST" });
      if (res.ok) {
        update(botsRef.current.map((b) => (b.id === id ? { ...b, status: "stopped" } : b)));
      }
    } finally {
      setAction(id, "idle");
    }
  };

  const handleRestart = async (id: string) => {
    setAction(id, "restarting");
    try {
      await fetch(`/api/hosting/${id}/restart`, { method: "POST" });
    } finally {
      setAction(id, "idle");
    }
  };

  const handleDelete = async (id: string) => {
    setAction(id, "deleting");
    try {
      await fetch(`/api/hosting/${id}`, { method: "DELETE" });
    } finally {
      update(botsRef.current.filter((b) => b.id !== id));
      setAction(id, "idle");
    }
  };

  const running = bots.filter((b) => b.status === "running").length;

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deine Bots und Projekte auf einen Blick.
          </p>
        </div>
        <NewBotDialog onAdd={handleAdd} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FolderOpen} label="Projekte" value={bots.length} />
        <StatCard
          icon={Activity}
          label="Online"
          value={running}
          sub={running > 0 ? "Bots aktiv" : "Kein Bot läuft"}
        />
        <StatCard icon={Server} label="Deployments" value={bots.length} sub="Gesamt" />
        <StatCard
          icon={Zap}
          label="Uptime"
          value={running > 0 ? "99.9%" : "—"}
          sub={running > 0 ? "Letzte 30 Tage" : undefined}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Deine Bots
          </p>
          {bots.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {running}/{bots.length} online
            </span>
          )}
        </div>

        {bots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 px-8 py-14 flex flex-col items-center text-center gap-5">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center">
              <Server className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h2 className="font-semibold">Noch kein Bot erstellt</h2>
              <p className="text-sm text-muted-foreground">
                Klicke auf „Neues Projekt" um deinen Bot hinzuzufügen und den Code im Editor zu bearbeiten.
              </p>
            </div>
            <NewBotDialog onAdd={handleAdd} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                actionState={actionStates[bot.id] ?? "idle"}
                onStart={handleStart}
                onStop={handleStop}
                onRestart={handleRestart}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
