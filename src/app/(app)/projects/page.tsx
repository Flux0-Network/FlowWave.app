"use client";

import Link from "next/link";
import {
  Blocks,
  Plus,
  Activity,
  Server,
  Zap,
  RotateCcw,
  Square,
  Play,
  Terminal,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

type BotStatus = "running" | "stopped" | "error";

interface Bot {
  id: string;
  name: string;
  status: BotStatus;
  deployedAt: string;
  uptime: string | null;
}

const STATUS_DOT: Record<BotStatus, string> = {
  running: "bg-emerald-400",
  stopped: "bg-zinc-500",
  error: "bg-red-500",
};

const STATUS_LABEL: Record<BotStatus, string> = {
  running: "Online",
  stopped: "Offline",
  error: "Error",
};

const STATUS_TEXT: Record<BotStatus, string> = {
  running: "text-emerald-400",
  stopped: "text-zinc-400",
  error: "text-red-400",
};

function StatusDot({ status }: { status: BotStatus }) {
  return (
    <span className="relative flex size-2">
      {status === "running" && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", STATUS_DOT[status])} />
      )}
      <span className={cn("relative inline-flex rounded-full size-2", STATUS_DOT[status])} />
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub }: {
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
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function BotCard({ bot, onToggle, onRestart }: {
  bot: Bot;
  onToggle: (id: string) => void;
  onRestart: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={bot.status} />
          <span className="font-medium text-sm truncate">{bot.name}</span>
        </div>
        <span className={cn("text-[11px] font-medium shrink-0", STATUS_TEXT[bot.status])}>
          {STATUS_LABEL[bot.status]}
        </span>
      </div>

      <div className="px-4 py-3 text-[11px] text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Deployed</span>
          <span className="text-foreground/70">{bot.deployedAt}</span>
        </div>
        {bot.uptime && (
          <div className="flex justify-between">
            <span>Uptime</span>
            <span className="text-emerald-400">{bot.uptime}</span>
          </div>
        )}
      </div>

      <div className="px-3 pb-3 flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground flex-1"
          onClick={() => onToggle(bot.id)}
        >
          {bot.status === "running" ? (
            <><Square className="size-3" />Stop</>
          ) : (
            <><Play className="size-3" />Start</>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => onRestart(bot.id)}
          disabled={bot.status !== "running"}
        >
          <RotateCcw className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
        >
          <Terminal className="size-3.5" />
        </Button>
        <Link
          href="/builder"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-7 text-muted-foreground hover:text-foreground"
          )}
        >
          <Blocks className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

const INITIAL_BOTS: Bot[] = [];

export default function ProjectsPage() {
  const [bots, setBots] = useState<Bot[]>(INITIAL_BOTS);

  const handleToggle = (id: string) => {
    setBots((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: b.status === "running" ? "stopped" : "running", uptime: b.status === "running" ? null : "0m" }
          : b
      )
    );
  };

  const handleRestart = (id: string) => {
    setBots((prev) =>
      prev.map((b) => (b.id === id ? { ...b, uptime: "0m" } : b))
    );
  };

  const running = bots.filter((b) => b.status === "running").length;

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deine Bots und Projekte auf einen Blick.
          </p>
        </div>
        <Link
          href="/builder"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0")}
        >
          <Plus className="size-3.5" />
          Neues Projekt
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FolderOpen} label="Projekte" value={bots.length} />
        <StatCard icon={Activity} label="Online" value={running} sub={running > 0 ? "Bots aktiv" : "Kein Bot läuft"} />
        <StatCard icon={Server} label="Deployments" value={bots.length} sub="Gesamt" />
        <StatCard icon={Zap} label="Uptime" value={running > 0 ? "99.9%" : "—"} sub={running > 0 ? "Letzte 30 Tage" : undefined} />
      </div>

      {/* Bots */}
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
              <h2 className="font-semibold">Noch kein Bot deployed</h2>
              <p className="text-sm text-muted-foreground">
                Erstelle deinen Bot im Builder und deploye ihn direkt von dort mit einem Klick.
              </p>
            </div>
            <Link
              href="/builder"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <Blocks className="size-3.5" />
              Zum Builder
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                onToggle={handleToggle}
                onRestart={handleRestart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
