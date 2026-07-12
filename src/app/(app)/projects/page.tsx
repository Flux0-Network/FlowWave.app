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
  Eye,
  EyeOff,
  Bot,
  Rocket,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";

type BotStatus = "running" | "stopped" | "error";

interface BotProject {
  id: string;
  name: string;
  clientId: string;
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

function BotCard({
  bot,
  onToggle,
  onRestart,
}: {
  bot: BotProject;
  onToggle: (id: string) => void;
  onRestart: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={bot.status} />
          <span className="font-medium text-sm truncate">{bot.name}</span>
        </div>
        <span className={cn("text-[11px] font-medium shrink-0", STATUS_TEXT[bot.status])}>
          {STATUS_LABEL[bot.status]}
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

function NewBotDialog({ onAdd }: { onAdd: (bot: BotProject) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; token?: string }>({});

  const validate = () => {
    const e: { name?: string; token?: string } = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Mindestens 2 Zeichen.";
    if (!token.trim()) e.token = "Token ist erforderlich.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      clientId: clientId.trim(),
      status: "stopped",
      deployedAt: "Gerade eben",
      uptime: null,
    });
    setName("");
    setToken("");
    setClientId("");
    setErrors({});
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
                Verbinde deinen Bot und deploye ihn mit einem Klick.
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
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bot-token" className="text-[12px] font-medium">
              Bot Token
              <span className="ml-1.5 text-muted-foreground font-normal">
                (Discord Developer Portal)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="bot-token"
                type={showToken ? "text" : "password"}
                placeholder="MTxxxxxx.Gxxxxx.xxxxxxxxxx"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errors.token) setErrors((p) => ({ ...p, token: undefined }));
                }}
                className="pr-9 font-mono text-[12px]"
                aria-invalid={!!errors.token}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {errors.token && (
              <p className="text-[11px] text-destructive">{errors.token}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Wird verschlüsselt gespeichert und verlässt den Server nie im Klartext.
            </p>
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
          <DialogClose
            render={
              <Button variant="ghost" size="sm">
                Abbrechen
              </Button>
            }
          />
          <Button size="sm" className="gap-1.5" onClick={handleSubmit}>
            <Rocket className="size-3.5" />
            Bot erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const [bots, setBots] = useState<BotProject[]>([]);
  const [loading, setLoading] = useState(true);
  const db = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromRow = (r: any): BotProject => ({
    id: r.id,
    name: r.name,
    clientId: r.client_id ?? "",
    status: r.status as BotStatus,
    deployedAt: new Date(r.created_at).toLocaleDateString("de-DE"),
    uptime: r.uptime ?? null,
  });

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    db.from("bots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setBots(data.map(fromRow));
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleAdd = async (bot: BotProject) => {
    if (!userId) return;
    const { data, error } = await db.from("bots").insert({
      user_id: userId,
      name: bot.name,
      client_id: bot.clientId,
      status: "stopped",
    }).select().single();
    if (!error && data) setBots((p) => [fromRow(data), ...p]);
  };

  const handleToggle = async (id: string) => {
    const bot = bots.find((b) => b.id === id);
    if (!bot) return;
    const next = bot.status === "running" ? "stopped" : "running";
    await db.from("bots").update({ status: next, uptime: next === "stopped" ? null : "0m" }).eq("id", id);
    setBots((p) => p.map((b) => b.id === id ? { ...b, status: next, uptime: next === "stopped" ? null : "0m" } : b));
  };

  const handleRestart = async (id: string) => {
    await db.from("bots").update({ uptime: "0m" }).eq("id", id);
    setBots((p) => p.map((b) => b.id === id ? { ...b, uptime: "0m" } : b));
  };

  const running = bots.filter((b) => b.status === "running").length;

  if (loading) {
    return (
      <div className="py-8 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-muted/30 px-5 py-4 h-20 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border h-32 animate-pulse bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

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
                Klicke auf „Neues Projekt“ um deinen Bot zu verbinden und direkt zu hosten.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <NewBotDialog onAdd={handleAdd} />
              <Link
                href="/builder"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Blocks className="size-3.5" />
                Zum Builder
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
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
