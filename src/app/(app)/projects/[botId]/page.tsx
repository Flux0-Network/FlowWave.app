"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Play, Square, RotateCcw, Rocket, Code2, Terminal,
  Database, Settings, Activity, AlertCircle, CheckCircle2,
  ChevronRight, Table2, Search, RefreshCw, Plug, Trash2,
  ChevronLeft, ChevronRight as ChevronRightIcon, X, Eye, EyeOff,
  KeyRound, Plus, Copy, Check, Package, PackagePlus, ExternalLink,
  HardDrive, FolderPlus, FolderOpen, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type BotStatus = "running" | "stopped" | "error";
interface BotProject {
  id: string;
  name: string;
  clientId: string;
  status: BotStatus;
  createdAt: string;
  code: string;
}

type Tab = "overview" | "storage" | "packages" | "env" | "database" | "logs" | "settings";

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = "cogsforge:bots";
function loadBots(): BotProject[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function saveBots(bots: BotProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
}

// ── Supabase connection type ──────────────────────────────────────────────────
interface SupabaseConn {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

// ── File storage helpers ──────────────────────────────────────────────────────
const MAX_STORAGE_BYTES = 25 * 1024 * 1024;
function formatBytes(n: number) {
  if (n === 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_DOT: Record<BotStatus, string> = {
  running: "bg-emerald-400", stopped: "bg-zinc-500", error: "bg-red-500",
};
const STATUS_LABEL: Record<BotStatus, string> = {
  running: "Online", stopped: "Offline", error: "Fehler",
};
const STATUS_TEXT: Record<BotStatus, string> = {
  running: "text-emerald-400", stopped: "text-zinc-400", error: "text-red-400",
};
function mapDockerStatus(s: string): BotStatus {
  if (s === "running" || s === "restarting") return "running";
  if (s === "dead") return "error";
  return "stopped";
}

function StatusDot({ status, ping = false }: { status: BotStatus; ping?: boolean }) {
  return (
    <span className="relative flex size-2 shrink-0">
      {ping && status === "running" && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", STATUS_DOT[status])} />
      )}
      <span className={cn("relative inline-flex rounded-full size-2", STATUS_DOT[status])} />
    </span>
  );
}

// ── Usage ring ────────────────────────────────────────────────────────────────
function UsageRing({ pct }: { pct: number }) {
  const r = 9, circ = 2 * Math.PI * r;
  const filled = Math.min(Math.max(pct, 0), 1) * circ;
  const color = pct > 0.85 ? "#e06c75" : pct > 0.6 ? "#e5c07b" : "#61afef";
  return (
    <svg viewBox="0 0 26 26" className="size-6 shrink-0" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="13" cy="13" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted-foreground/20" />
      <circle cx="13" cy="13" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" />
    </svg>
  );
}

function UsageSection({ botId }: { botId: string }) {
  const [metrics, setMetrics] = useState({ storageBytes: 0, storageFiles: 0, packages: 0, envVars: 0 });

  useEffect(() => {
    let storageBytes = 0, storageFiles = 0, packages = 0;
    try {
      const bots = JSON.parse(localStorage.getItem("cogsforge:bots") ?? "[]");
      const bot = bots.find((b: BotProject) => b.id === botId);
      if (bot?.code) {
        const files: { name: string; content: string }[] = JSON.parse(bot.code);
        if (Array.isArray(files)) {
          storageFiles = files.length;
          storageBytes = files.reduce((s, f) => s + new TextEncoder().encode(f.content).length, 0);
          const req = files.find((f) => f.name === "requirements.txt");
          if (req) packages = parseRequirements(req.content).length;
        }
      }
    } catch {}

    let envVars = 0;
    try { envVars = JSON.parse(localStorage.getItem(`flowwave:env:${botId}`) ?? "[]").length; }
    catch {}

    setMetrics({ storageBytes, storageFiles, packages, envVars });
  }, [botId]);

  const rows = [
    { label: "Speicher",        value: formatBytes(metrics.storageBytes), limit: "25 MB",  pct: metrics.storageBytes / MAX_STORAGE_BYTES },
    { label: "Dateien",         value: String(metrics.storageFiles),      limit: "100",    pct: metrics.storageFiles / 100 },
    { label: "Pakete",          value: String(metrics.packages),          limit: "20",     pct: metrics.packages / 20 },
    { label: "Env Variables",   value: String(metrics.envVars),           limit: "50",     pct: metrics.envVars / 50 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nutzung</p>
        <p className="text-[10px] text-muted-foreground">Aktuell</p>
      </div>
      <div className="divide-y divide-border/40">
        {rows.map(({ label, value, limit, pct }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-3 hover:bg-accent/10 transition-colors">
            <UsageRing pct={pct} />
            <span className="flex-1 text-[12px] text-foreground/80">{label}</span>
            <span className="text-[12px] font-mono text-muted-foreground">{value} / {limit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ bot, onStart, onStop, onRestart, actionState }: {
  bot: BotProject;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  actionState: string;
}) {
  const busy = actionState !== "idle";
  const uptime = bot.status === "running"
    ? `Aktiv seit ${new Date(bot.createdAt).toLocaleDateString("de-DE")}`
    : "Bot ist offline";

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusDot status={bot.status} ping />
            <div>
              <p className={cn("text-sm font-semibold", STATUS_TEXT[bot.status])}>
                {STATUS_LABEL[bot.status]}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{uptime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-[11px] gap-1.5"
              onClick={bot.status === "running" ? onStop : onStart}
              disabled={busy}
            >
              {bot.status === "running"
                ? <><Square className="size-3" />Stop</>
                : <><Play className="size-3" />Start</>
              }
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-[11px] gap-1.5"
              onClick={onRestart}
              disabled={busy || bot.status !== "running"}
            >
              <RotateCcw className={cn("size-3", busy && "animate-spin")} />
              Restart
            </Button>
            <Link href={`/projects/${bot.id}/editor`}>
              <Button size="sm" className="h-7 px-3 text-[11px] gap-1.5">
                <Code2 className="size-3" />
                Code Editor
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/60">
          {[
            { label: "Projekt ID", value: bot.id.slice(0, 12) + "…" },
            { label: "Erstellt", value: new Date(bot.createdAt).toLocaleDateString("de-DE") },
            { label: "Client ID", value: bot.clientId ? bot.clientId.slice(0, 8) + "…" : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
              <p className="text-sm font-mono mt-0.5 text-foreground/80">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy section */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Deploy</h3>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Öffne den Code Editor um deinen Bot zu deployen. Der Bot Token wird sicher im Editor eingegeben und nicht gespeichert.
        </p>
        <div className="flex gap-2 mt-3">
          <Link href={`/projects/${bot.id}/editor`}>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5">
              <Code2 className="size-3" />
              Im Editor öffnen
            </Button>
          </Link>
        </div>
      </div>

      {bot.status === "error" && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 flex items-start gap-3">
          <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Bot abgestürzt</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Der Bot konnte nicht starten oder ist unerwartet beendet worden. Überprüfe die Logs oder den Code.
            </p>
            <div className="flex gap-2 mt-2">
              <Link href={`/projects/${bot.id}/editor`}>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5">
                  <Code2 className="size-3" />Code prüfen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <UsageSection botId={bot.id} />
    </div>
  );
}

// ── Logs Tab ──────────────────────────────────────────────────────────────────
function LogsTab({ botId }: { botId: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    setLoading(true);
    fetchLogs().finally(() => setLoading(false));
    const iv = setInterval(fetchLogs, 3000);
    return () => clearInterval(iv);
  }, [fetchLogs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Live Logs</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Aktualisiert alle 3 Sekunden</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5" onClick={() => { setLoading(true); fetchLogs().finally(() => setLoading(false)); }}>
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-zinc-950 dark:bg-black/60 p-4 font-mono text-[11px] leading-relaxed min-h-96 max-h-[60vh] overflow-y-auto">
        {loading && lines.length === 0 ? (
          <span className="text-zinc-500">Lade Logs…</span>
        ) : lines.length === 0 ? (
          <span className="text-zinc-500">Keine Logs verfügbar. Starte den Bot um Logs zu sehen.</span>
        ) : (
          lines.map((l, i) => (
            <div key={i} className="text-zinc-300 whitespace-pre-wrap break-all hover:bg-white/3 px-1 -mx-1 rounded">{l}</div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ bot, onUpdate, onDelete }: {
  bot: BotProject;
  onUpdate: (b: BotProject) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(bot.name);
  const [clientId, setClientId] = useState(bot.clientId);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleSave = () => {
    const updated = { ...bot, name: name.trim() || bot.name, clientId: clientId.trim() };
    const bots = loadBots().map((b) => b.id === bot.id ? updated : b);
    saveBots(bots);
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-4">
        <h3 className="text-sm font-semibold">Allgemein</h3>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Bot Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Application ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-8 text-sm font-mono" placeholder="1234567890123456789" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-7 text-[11px]" onClick={handleSave}>Speichern</Button>
          {saved && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="size-3" />Gespeichert
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 space-y-3">
        <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        <p className="text-[12px] text-muted-foreground">Das Löschen des Projekts ist unwiderruflich. Alle Daten werden entfernt.</p>
        {!confirm ? (
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => setConfirm(true)}>
            <Trash2 className="size-3" />Projekt löschen
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Wirklich löschen?</span>
            <Button size="sm" className="h-7 text-[11px] bg-red-500 hover:bg-red-600 text-white" onClick={onDelete}>Ja, löschen</Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setConfirm(false)}>Abbrechen</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Packages Tab ─────────────────────────────────────────────────────────────
interface PkgEntry { name: string; version: string; }

const POPULAR_PACKAGES = [
  { name: "py-cord",         label: "Pycord",         desc: "Discord API wrapper (fork)" },
  { name: "discord.py",      label: "discord.py",     desc: "Original Discord wrapper" },
  { name: "aiohttp",         label: "aiohttp",        desc: "Async HTTP client" },
  { name: "aiosqlite",       label: "aiosqlite",      desc: "Async SQLite" },
  { name: "python-dotenv",   label: "python-dotenv",  desc: ".env Dateien laden" },
  { name: "requests",        label: "requests",       desc: "HTTP requests" },
  { name: "Pillow",          label: "Pillow",         desc: "Bildverarbeitung" },
  { name: "motor",           label: "motor",          desc: "Async MongoDB" },
];

function parseRequirements(content: string): PkgEntry[] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const match = l.match(/^([A-Za-z0-9_\-\.]+)(?:[=~<>!]+(.+))?$/);
      if (!match) return null;
      return { name: match[1], version: match[2]?.trim() ?? "" };
    })
    .filter(Boolean) as PkgEntry[];
}

function buildRequirements(pkgs: PkgEntry[]): string {
  return pkgs.map((p) => p.version ? `${p.name}==${p.version.replace(/^==/, "")}` : p.name).join("\n") + "\n";
}

function PackagesTab({ botId }: { botId: string }) {
  const [pkgs, setPkgs] = useState<PkgEntry[]>([]);
  const [newName, setNewName] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const getFiles = useCallback((): Array<{ name: string; content: string }> => {
    try {
      const bots = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      const bot = bots.find((b: BotProject) => b.id === botId);
      if (!bot?.code) return [];
      const parsed = JSON.parse(bot.code);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [botId]);

  const saveFiles = useCallback((files: Array<{ name: string; content: string }>) => {
    const bots = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const updated = bots.map((b: BotProject) =>
      b.id === botId ? { ...b, code: JSON.stringify(files) } : b
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [botId]);

  useEffect(() => {
    const files = getFiles();
    const req = files.find((f) => f.name === "requirements.txt");
    setPkgs(req ? parseRequirements(req.content) : []);
  }, [getFiles]);

  const persistPkgs = (next: PkgEntry[]) => {
    setPkgs(next);
    const files = getFiles();
    const reqContent = buildRequirements(next);
    const hasReq = files.some((f) => f.name === "requirements.txt");
    const updated = hasReq
      ? files.map((f) => f.name === "requirements.txt" ? { ...f, content: reqContent } : f)
      : [...files, { name: "requirements.txt", content: reqContent }];
    saveFiles(updated);
  };

  const handleAdd = (name = newName, version = newVersion) => {
    const n = name.trim();
    if (!n) { setError("Name erforderlich."); return; }
    if (pkgs.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
      setError(`"${n}" ist bereits vorhanden.`); return;
    }
    setError("");
    persistPkgs([...pkgs, { name: n, version: version.trim() }]);
    setNewName(""); setNewVersion("");
  };

  const handleDelete = (idx: number) => persistPkgs(pkgs.filter((_, i) => i !== idx));

  const handleVersionChange = (idx: number, v: string) =>
    persistPkgs(pkgs.map((p, i) => i === idx ? { ...p, version: v } : p));

  const filteredPopular = POPULAR_PACKAGES.filter(
    (p) => !pkgs.some((e) => e.name.toLowerCase() === p.name.toLowerCase()) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold">Pakete</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Verwaltet deine <code className="bg-muted px-1 rounded text-[11px]">requirements.txt</code> — wird beim Deploy automatisch installiert.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Paket hinzufügen</p>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(""); }}
            placeholder="z.B. py-cord"
            className="h-8 text-[12px] font-mono flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Input
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            placeholder="Version (opt.) z.B. 2.6.1"
            className="h-8 text-[12px] font-mono w-44 shrink-0"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" className="h-8 px-3 text-[11px] gap-1.5 shrink-0" onClick={() => handleAdd()}>
            <PackagePlus className="size-3" />
            Hinzufügen
          </Button>
        </div>
        {error && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle className="size-3" />{error}</p>}
        <p className="text-[10px] text-muted-foreground">
          Ohne Version → immer aktuellste. Mit Version → <code className="bg-muted px-0.5 rounded">paket==1.2.3</code>
        </p>
      </div>

      {/* Installed packages */}
      {pkgs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Installiert ({pkgs.length})
          </p>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_auto] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border bg-muted/40">
              <span>Paket</span><span>Version</span><span></span>
            </div>
            {pkgs.map((pkg, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-center px-4 py-2.5 border-b border-border/60 last:border-0 hover:bg-accent/20 gap-3 group">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-[12px] text-foreground/80 truncate">{pkg.name}</span>
                </div>
                <input
                  value={pkg.version}
                  onChange={(e) => handleVersionChange(idx, e.target.value)}
                  placeholder="neueste"
                  className="font-mono text-[12px] bg-transparent border border-transparent hover:border-border focus:border-primary/40 rounded px-1.5 py-0.5 focus:outline-none text-foreground/60 w-full"
                />
                <button
                  onClick={() => handleDelete(idx)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 rounded transition-opacity"
                  title="Entfernen"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular suggestions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Beliebte Pakete</p>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen…"
              className="pl-6 pr-2 py-1 text-[11px] bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 w-36"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredPopular.map((p) => (
            <button
              key={p.name}
              onClick={() => handleAdd(p.name, "")}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent/40 hover:border-primary/30 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Package className="size-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-mono font-medium text-foreground/80 truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.desc}</p>
                </div>
              </div>
              <Plus className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            </button>
          ))}
          {filteredPopular.length === 0 && (
            <p className="text-[12px] text-muted-foreground col-span-2 py-2">Alle beliebten Pakete sind bereits installiert.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Env Tab ───────────────────────────────────────────────────────────────────
interface EnvVar { key: string; value: string; hidden: boolean; }

function EnvTab({ botId }: { botId: string }) {
  const STORE = `flowwave:env:${botId}`;
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newHide, setNewHide] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  useEffect(() => {
    try { setVars(JSON.parse(localStorage.getItem(STORE) ?? "[]")); }
    catch { setVars([]); }
  }, [STORE]);

  const persist = (next: EnvVar[]) => {
    setVars(next);
    localStorage.setItem(STORE, JSON.stringify(next));
  };

  const handleAdd = () => {
    const k = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!k || !newVal.trim()) return;
    if (vars.some((v) => v.key === k)) return;
    persist([...vars, { key: k, value: newVal.trim(), hidden: newHide }]);
    setNewKey(""); setNewVal("");
  };

  const handleDelete = (idx: number) => persist(vars.filter((_, i) => i !== idx));

  const handleCopy = async (idx: number) => {
    await navigator.clipboard.writeText(vars[idx].value);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleToggleHide = (idx: number) =>
    persist(vars.map((v, i) => i === idx ? { ...v, hidden: !v.hidden } : v));

  const handleStartEdit = (idx: number) => {
    setEditIdx(idx);
    setEditVal(vars[idx].value);
  };

  const handleCommitEdit = (idx: number) => {
    if (editVal.trim()) persist(vars.map((v, i) => i === idx ? { ...v, value: editVal.trim() } : v));
    setEditIdx(null);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold">Environment Variables</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Variablen werden lokal gespeichert. Im Editor per <code className="bg-muted px-1 rounded text-[11px]">os.environ[&apos;KEY&apos;]</code> verwenden.
        </p>
      </div>

      {/* Add new */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Neue Variable</p>
        <div className="flex gap-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
            placeholder="KEY_NAME"
            className="h-8 text-[12px] font-mono w-44 shrink-0"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="relative flex-1">
            <Input
              type={newHide ? "password" : "text"}
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              placeholder="wert"
              className="h-8 text-[12px] font-mono pr-8 w-full"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button type="button" onClick={() => setNewHide((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {newHide ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <Button size="sm" className="h-8 px-3 text-[11px] gap-1.5 shrink-0" onClick={handleAdd} disabled={!newKey.trim() || !newVal.trim()}>
            <Plus className="size-3" />
            Hinzufügen
          </Button>
        </div>
      </div>

      {/* List */}
      {vars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 flex flex-col items-center gap-3 text-center">
          <KeyRound className="size-6 text-muted-foreground/40" />
          <p className="text-[12px] text-muted-foreground">Noch keine Variablen. Füge deine erste Variable oben hinzu.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_auto] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border bg-muted/40">
            <span>Key</span><span>Value</span><span></span>
          </div>
          {vars.map((v, idx) => (
            <div key={v.key} className="grid grid-cols-[1fr_2fr_auto] items-center px-4 py-2.5 border-b border-border/60 last:border-0 hover:bg-accent/20 gap-3 group">
              <span className="font-mono text-[12px] text-foreground/80 truncate">{v.key}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                {editIdx === idx ? (
                  <input
                    autoFocus
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onBlur={() => handleCommitEdit(idx)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCommitEdit(idx); if (e.key === "Escape") setEditIdx(null); }}
                    className="flex-1 min-w-0 bg-background border border-primary/40 rounded px-2 py-0.5 font-mono text-[12px] focus:outline-none"
                  />
                ) : (
                  <span
                    className="font-mono text-[12px] text-foreground/60 truncate cursor-pointer hover:text-foreground/80 flex-1 min-w-0"
                    onClick={() => handleStartEdit(idx)}
                    title="Klicken zum Bearbeiten"
                  >
                    {v.hidden ? "•".repeat(Math.min(v.value.length, 20)) : v.value}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggleHide(idx)} title={v.hidden ? "Anzeigen" : "Verbergen"} className="p-1 text-muted-foreground hover:text-foreground rounded">
                  {v.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button onClick={() => handleCopy(idx)} title="Kopieren" className="p-1 text-muted-foreground hover:text-foreground rounded">
                  {copiedIdx === idx ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
                <button onClick={() => handleDelete(idx)} title="Löschen" className="p-1 text-muted-foreground hover:text-red-400 rounded">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {vars.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {vars.length} Variable{vars.length !== 1 ? "n" : ""} · Klicke auf einen Wert zum Bearbeiten
        </p>
      )}
    </div>
  );
}

// ── Database Tab ──────────────────────────────────────────────────────────────
type SupabaseTableDef = Record<string, { type: string; description?: string }>;
type SupabaseSpec = {
  paths: Record<string, unknown>;
  definitions: Record<string, { properties?: SupabaseTableDef }>;
};

function DatabaseTab({ botId }: { botId: string }) {
  const CONN_KEY = `flowwave:supabase:${botId}`;
  const [conn, setConn] = useState<SupabaseConn | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<Record<string, string[]>>({});
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [rowCols, setRowCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [rowFilter, setRowFilter] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [sqlMode, setSqlMode] = useState(false);
  const [sql, setSql] = useState("SELECT * FROM ");
  const [sqlRows, setSqlRows] = useState<Record<string, unknown>[]>([]);
  const [sqlCols, setSqlCols] = useState<string[]>([]);
  const [sqlError, setSqlError] = useState("");
  const [sqlLoading, setSqlLoading] = useState(false);
  const PAGE_SIZE = 50;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONN_KEY);
      if (raw) setConn(JSON.parse(raw));
    } catch {}
  }, [CONN_KEY]);

  const headers = useCallback((key: string) => ({
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
  }), []);

  const fetchSchema = useCallback(async (c: SupabaseConn) => {
    try {
      const res = await fetch(`${c.url}/rest/v1/`, { headers: headers(c.anonKey) });
      const spec: SupabaseSpec = await res.json();
      const tableNames = Object.keys(spec.paths ?? {})
        .filter((p) => !p.includes("{") && p !== "/")
        .map((p) => p.replace(/^\//, ""));
      setTables(tableNames);
      const cols: Record<string, string[]> = {};
      for (const t of tableNames) {
        const def = spec.definitions?.[t];
        if (def?.properties) cols[t] = Object.keys(def.properties);
      }
      setColumns(cols);
    } catch {}
  }, [headers]);

  useEffect(() => {
    if (conn) fetchSchema(conn);
  }, [conn, fetchSchema]);

  const fetchRows = useCallback(async (table: string, offset = 0, filter = "") => {
    if (!conn) return;
    setLoading(true);
    try {
      let url = `${conn.url}/rest/v1/${table}?limit=${PAGE_SIZE}&offset=${offset}`;
      if (filter) url += `&${filter}`;
      const res = await fetch(url, {
        headers: { ...headers(conn.anonKey), "Prefer": "count=exact" },
      });
      const contentRange = res.headers.get("content-range");
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) setTotal(parseInt(match[1]));
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
        setRowCols(data.length > 0 ? Object.keys(data[0]) : (columns[table] ?? []));
      } else {
        setRows([]); setRowCols(columns[table] ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [conn, columns, headers]);

  const handleTableClick = (t: string) => {
    setActiveTable(t);
    setPage(0);
    setRowFilter("");
    setSqlMode(false);
    fetchRows(t, 0);
  };

  const handleRunSql = async () => {
    if (!conn || !sql.trim()) return;
    const key = conn.serviceKey || conn.anonKey;
    const tableMatch = sql.match(/from\s+"?(\w+)"?/i);
    if (!tableMatch) { setSqlError("Kein FROM gefunden. Nur SELECT-Abfragen auf Tabellen werden unterstützt."); return; }
    const table = tableMatch[1];
    const selectMatch = sql.match(/select\s+(.*?)\s+from/i);
    const select = selectMatch ? selectMatch[1].trim() : "*";
    const whereMatch = sql.match(/where\s+([\s\S]*?)(?:order|limit|offset|$)/i);
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    const orderMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);

    setSqlLoading(true); setSqlError(""); setSqlRows([]); setSqlCols([]);
    try {
      let url = `${conn.url}/rest/v1/${table}?select=${select}`;
      if (whereMatch?.[1]) url += `&${whereMatch[1].trim().replace(/\s*=\s*/g, "=eq.")}`;
      if (limitMatch) url += `&limit=${limitMatch[1]}`;
      if (orderMatch) url += `&order=${orderMatch[1]}.${(orderMatch[2] ?? "asc").toLowerCase()}`;

      const res = await fetch(url, { headers: headers(key) });
      const data = await res.json();
      if (!res.ok) { setSqlError(JSON.stringify(data)); return; }
      if (Array.isArray(data)) {
        setSqlRows(data);
        setSqlCols(data.length > 0 ? Object.keys(data[0]) : []);
      }
    } catch (e) {
      setSqlError(String(e));
    } finally { setSqlLoading(false); }
  };

  if (!conn) {
    return <ConnectSupabaseForm onConnect={(c) => {
      localStorage.setItem(CONN_KEY, JSON.stringify(c));
      setConn(c);
    }} />;
  }

  const filteredTables = tables.filter((t) =>
    t.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-14rem)] rounded-xl border border-border overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-border bg-card/40 flex flex-col">
        <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tabellen</span>
          </div>
          <button
            onClick={() => { setConn(null); localStorage.removeItem(CONN_KEY); setTables([]); setActiveTable(null); }}
            title="Verbindung trennen"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </div>
        <div className="px-2 py-1.5 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Tabelle suchen…"
              className="w-full pl-6 pr-2 py-1 text-[11px] bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filteredTables.length === 0 ? (
            <p className="text-[11px] text-muted-foreground px-3 py-2">Keine Tabellen gefunden</p>
          ) : filteredTables.map((t) => (
            <button
              key={t}
              onClick={() => handleTableClick(t)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors",
                activeTable === t
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Table2 className="size-3 shrink-0" />
              <span className="truncate">{t}</span>
            </button>
          ))}
        </div>
        <div className="px-2 py-2 border-t border-border/60">
          <button
            onClick={() => { setSqlMode(true); setActiveTable(null); }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md transition-colors",
              sqlMode && !activeTable
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Code2 className="size-3 shrink-0" />
            SQL Editor
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {!activeTable && !sqlMode ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-2">
              <Table2 className="size-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">Wähle eine Tabelle aus der Sidebar</p>
              <p className="text-[11px] text-muted-foreground/60">oder öffne den SQL Editor</p>
            </div>
          </div>
        ) : sqlMode ? (
          <SqlEditor
            sql={sql}
            onSqlChange={setSql}
            onRun={handleRunSql}
            loading={sqlLoading}
            rows={sqlRows}
            cols={sqlCols}
            error={sqlError}
            hasServiceKey={!!conn.serviceKey}
          />
        ) : (
          <TableView
            table={activeTable!}
            rows={rows}
            cols={rowCols}
            loading={loading}
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onRefresh={() => fetchRows(activeTable!, page * PAGE_SIZE, rowFilter)}
            onPageChange={(p) => { setPage(p); fetchRows(activeTable!, p * PAGE_SIZE, rowFilter); }}
          />
        )}
      </div>
    </div>
  );
}

function ConnectSupabaseForm({ onConnect }: { onConnect: (c: SupabaseConn) => void }) {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [showAnon, setShowAnon] = useState(false);
  const [showService, setShowService] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!url.trim() || !anonKey.trim()) { setError("URL und Anon Key sind erforderlich."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onConnect({ url: url.replace(/\/$/, ""), anonKey, serviceKey: serviceKey.trim() || undefined });
    } catch (e) {
      setError("Verbindung fehlgeschlagen. Überprüfe URL und Key.");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Plug className="size-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold">Supabase verbinden</h3>
            <p className="text-[12px] text-muted-foreground">Verbinde dein Supabase-Projekt</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px]">Project URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xyzcompany.supabase.co"
            className="h-8 text-[12px] font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px]">Anon Key <span className="text-muted-foreground font-normal">(public)</span></Label>
          <div className="relative">
            <Input
              type={showAnon ? "text" : "password"}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJI…"
              className="h-8 text-[12px] font-mono pr-8"
            />
            <button type="button" onClick={() => setShowAnon(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showAnon ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px]">Service Role Key <span className="text-muted-foreground font-normal">(optional, für SQL Editor)</span></Label>
          <div className="relative">
            <Input
              type={showService ? "text" : "password"}
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="eyJhbGciOiJI…"
              className="h-8 text-[12px] font-mono pr-8"
            />
            <button type="button" onClick={() => setShowService(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showService ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[11px] text-red-400">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <Button className="w-full h-8 text-[12px]" onClick={handleConnect} disabled={loading}>
          {loading ? <><RefreshCw className="size-3 animate-spin mr-1.5" />Verbinde…</> : <><Plug className="size-3 mr-1.5" />Verbinden</>}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Die Keys werden nur lokal in deinem Browser gespeichert.
        </p>
      </div>
    </div>
  );
}

function TableView({ table, rows, cols, loading, page, total, pageSize, onRefresh, onPageChange }: {
  table: string; rows: Record<string, unknown>[]; cols: string[]; loading: boolean;
  page: number; total: number; pageSize: number;
  onRefresh: () => void; onPageChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">{table}</span>
          <span className="text-[11px] text-muted-foreground">
            {total > 0 ? `${total} Zeilen` : ""}
          </span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1.5" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-[12px] gap-2">
            <RefreshCw className="size-3.5 animate-spin" />Lade Daten…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-[12px]">
            Keine Zeilen in dieser Tabelle
          </div>
        ) : (
          <table className="w-full text-[12px] border-collapse">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="text-left px-3 py-2 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
                  {cols.map((c) => {
                    const val = row[c];
                    const str = val === null ? "null" : val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
                    return (
                      <td key={c} className={cn(
                        "px-3 py-1.5 max-w-[240px] truncate align-top",
                        val === null ? "text-muted-foreground/50 italic" : "text-foreground/80"
                      )}>
                        {str}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border shrink-0 text-[11px]">
          <span className="text-muted-foreground">
            Seite {page + 1} von {pages} · {total} Zeilen gesamt
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="size-6" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="size-3" />
            </Button>
            <Button size="icon" variant="ghost" className="size-6" disabled={page >= pages - 1} onClick={() => onPageChange(page + 1)}>
              <ChevronRightIcon className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SqlEditor({ sql, onSqlChange, onRun, loading, rows, cols, error, hasServiceKey }: {
  sql: string; onSqlChange: (s: string) => void; onRun: () => void;
  loading: boolean; rows: Record<string, unknown>[]; cols: string[];
  error: string; hasServiceKey: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <span className="text-sm font-semibold">SQL Editor</span>
        <Button size="sm" className="h-7 text-[11px] gap-1.5" onClick={onRun} disabled={loading}>
          {loading ? <RefreshCw className="size-3 animate-spin" /> : <Play className="size-3" />}
          Ausführen
        </Button>
      </div>

      <div className="p-3 border-b border-border shrink-0">
        <textarea
          value={sql}
          onChange={(e) => onSqlChange(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onRun(); } }}
          className="w-full h-32 bg-muted/40 border border-border rounded-lg p-3 font-mono text-[12px] leading-[1.6] resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground"
          placeholder="SELECT * FROM table_name LIMIT 50;"
          spellCheck={false}
        />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {hasServiceKey ? "⌘+Enter zum Ausführen" : "Hinweis: Nur SELECT-Abfragen auf zugängliche Tabellen. Service Role Key für erweiterte Queries."}
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="m-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-[12px] font-mono text-red-400">
            {error}
          </div>
        ) : rows.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-[12px]">
            Führe eine Abfrage aus um Ergebnisse zu sehen
          </div>
        ) : (
          <table className="w-full text-[12px] border-collapse">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="text-left px-3 py-2 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-accent/30">
                  {cols.map((c) => {
                    const val = row[c];
                    const str = val === null ? "null" : typeof val === "object" ? JSON.stringify(val) : String(val);
                    return (
                      <td key={c} className={cn("px-3 py-1.5 max-w-[240px] truncate", val === null ? "text-muted-foreground/50 italic" : "text-foreground/80")}>
                        {str}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Storage Tab ───────────────────────────────────────────────────────────────
function StorageTab({ botId }: { botId: string }) {
  const BOTS_KEY = "cogsforge:bots";
  const FOLDERS_KEY = `flowwave:folders:${botId}`;

  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [emptyFolders, setEmptyFolders] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [crumbs, setCrumbs] = useState<string[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    try {
      const bots = JSON.parse(localStorage.getItem(BOTS_KEY) ?? "[]");
      const bot = bots.find((b: BotProject) => b.id === botId);
      if (bot?.code) {
        const parsed = JSON.parse(bot.code);
        setFiles(Array.isArray(parsed) ? parsed : []);
      } else { setFiles([]); }
    } catch { setFiles([]); }
    try { setEmptyFolders(JSON.parse(localStorage.getItem(FOLDERS_KEY) ?? "[]")); }
    catch { setEmptyFolders([]); }
  }, [botId]);

  useEffect(() => { load(); }, [load]);

  const saveFiles = (next: { name: string; content: string }[]) => {
    const bots = JSON.parse(localStorage.getItem(BOTS_KEY) ?? "[]");
    const updated = bots.map((b: BotProject) => b.id === botId ? { ...b, code: JSON.stringify(next) } : b);
    localStorage.setItem(BOTS_KEY, JSON.stringify(updated));
    setFiles(next);
  };

  const saveFolders = (next: string[]) => {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(next));
    setEmptyFolders(next);
  };

  const prefix = currentPath ? currentPath + "/" : "";
  const childFolderNames = new Set<string>();
  const childFiles: { name: string; content: string }[] = [];

  for (const f of emptyFolders) {
    const seg = prefix ? (f.startsWith(prefix) ? f.slice(prefix.length) : null) : f;
    if (seg !== null && !seg.includes("/") && seg) childFolderNames.add(seg);
  }
  for (const file of files) {
    if (!prefix) {
      const parts = file.name.split("/");
      if (parts.length === 1) childFiles.push(file);
      else childFolderNames.add(parts[0]);
    } else if (file.name.startsWith(prefix)) {
      const rest = file.name.slice(prefix.length);
      const parts = rest.split("/");
      if (parts.length === 1) childFiles.push(file);
      else childFolderNames.add(parts[0]);
    }
  }

  const sortedFolders = [...childFolderNames].sort();
  const sortedFiles = [...childFiles].sort((a, b) => a.name.localeCompare(b.name));

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setCrumbs(path ? path.split("/") : []);
    setCreatingFolder(false); setCreatingFile(false); setError("");
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim().replace(/\//g, "");
    if (!name) return;
    const fullPath = prefix + name;
    if (childFolderNames.has(name)) { setError(`Ordner "${name}" existiert bereits.`); return; }
    saveFolders([...emptyFolders, fullPath]);
    setNewFolderName(""); setCreatingFolder(false); setError("");
  };

  const handleCreateFile = () => {
    const name = newFileName.trim().replace(/\//g, "");
    if (!name) return;
    const fullName = prefix + name;
    if (files.some((f) => f.name === fullName)) { setError(`Datei "${name}" existiert bereits.`); return; }
    saveFiles([...files, { name: fullName, content: "" }]);
    setNewFileName(""); setCreatingFile(false); setError("");
  };

  const handleDeleteFile = (fileName: string) => saveFiles(files.filter((f) => f.name !== fileName));

  const handleDeleteFolder = (folderName: string) => {
    const folderPath = prefix + folderName;
    const fp = folderPath + "/";
    saveFiles(files.filter((f) => f.name !== folderPath && !f.name.startsWith(fp)));
    saveFolders(emptyFolders.filter((f) => f !== folderPath && !f.startsWith(fp)));
  };

  const fileSize = (f: { content: string }) => new TextEncoder().encode(f.content).length;
  const totalBytes = files.reduce((s, f) => s + fileSize(f), 0);
  const pct = totalBytes / MAX_STORAGE_BYTES;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Projektdateien</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatBytes(totalBytes)} · {files.length} Dateien · Änderungen wirken sich im Editor aus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5"
            onClick={() => { setCreatingFolder(true); setNewFolderName(""); }}>
            <FolderPlus className="size-3" />Ordner
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5"
            onClick={() => { setCreatingFile(true); setNewFileName(""); }}>
            <Plus className="size-3" />Datei
          </Button>
          <Link href={`/projects/${botId}/editor`}>
            <Button size="sm" className="h-7 text-[11px] gap-1.5">
              <Code2 className="size-3" />Editor öffnen
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", pct > 0.8 ? "bg-red-400" : "bg-blue-400")}
          style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>

      <div className="flex items-center gap-1 text-[11px] flex-wrap">
        <button onClick={() => navigateTo("")}
          className={cn("hover:text-foreground transition-colors", !currentPath ? "text-foreground font-medium" : "text-muted-foreground")}>
          Dateien
        </button>
        {crumbs.map((crumb, i) => {
          const pathUpTo = crumbs.slice(0, i + 1).join("/");
          return (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="size-3 text-muted-foreground/50" />
              <button onClick={() => navigateTo(pathUpTo)}
                className={cn("hover:text-foreground transition-colors",
                  i === crumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground")}>
                {crumb}
              </button>
            </span>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[11px] text-red-400 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
          <AlertCircle className="size-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}><X className="size-3" /></button>
        </div>
      )}

      {creatingFolder && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/40 bg-card">
          <FolderOpen className="size-4 text-yellow-400 shrink-0" />
          <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") { setCreatingFolder(false); setError(""); } }}
            placeholder="Ordnername…"
            className="flex-1 bg-transparent text-[12px] focus:outline-none text-foreground" />
          <Button size="sm" className="h-6 px-2 text-[10px]" onClick={handleCreateFolder}>Erstellen</Button>
          <button onClick={() => { setCreatingFolder(false); setError(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {creatingFile && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/40 bg-card">
          <FileText className="size-4 text-blue-400 shrink-0" />
          <input autoFocus value={newFileName} onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFile(); if (e.key === "Escape") { setCreatingFile(false); setError(""); } }}
            placeholder="dateiname.py…"
            className="flex-1 bg-transparent text-[12px] focus:outline-none text-foreground" />
          <Button size="sm" className="h-6 px-2 text-[10px]" onClick={handleCreateFile}>Erstellen</Button>
          <button onClick={() => { setCreatingFile(false); setError(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {sortedFolders.length === 0 && sortedFiles.length === 0 && !creatingFolder && !creatingFile ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <HardDrive className="size-8 text-muted-foreground/30" />
            <p className="text-[12px] text-muted-foreground">Keine Dateien vorhanden.</p>
            <p className="text-[11px] text-muted-foreground/60">Erstelle Dateien im Editor oder füge sie hier hinzu.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[auto_1fr_auto_auto] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border bg-muted/40 gap-3">
              <span className="w-4" /><span>Name</span><span className="text-right">Größe</span><span className="w-16" />
            </div>
            <div className="divide-y divide-border/40">
              {sortedFolders.map((folderName) => {
                const folderPath = prefix + folderName;
                const fp = folderPath + "/";
                const childCount = files.filter((f) => f.name.startsWith(fp)).length +
                  emptyFolders.filter((f) => f.startsWith(fp)).length;
                return (
                  <div key={folderName} className="grid grid-cols-[auto_1fr_auto_auto] items-center px-4 py-2.5 hover:bg-accent/20 group transition-colors gap-3">
                    <FolderOpen className="size-4 text-yellow-400 shrink-0" />
                    <div className="min-w-0">
                      <button className="text-[12px] text-foreground/80 hover:text-foreground transition-colors text-left truncate max-w-xs block font-medium"
                        onClick={() => navigateTo(folderPath)}>
                        {folderName}
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{childCount} Elemente</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono text-right">—</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => handleDeleteFolder(folderName)} title="Löschen"
                        className="p-1 text-muted-foreground hover:text-red-400 rounded">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {sortedFiles.map((file) => (
                <div key={file.name} className="grid grid-cols-[auto_1fr_auto_auto] items-center px-4 py-2.5 hover:bg-accent/20 group transition-colors gap-3">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-foreground/80 truncate">{file.name.split("/").pop()}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{file.name}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono text-right">{formatBytes(fileSize(file))}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <Link href={`/projects/${botId}/editor`} title="Im Editor öffnen"
                      className="p-1 text-muted-foreground hover:text-foreground rounded">
                      <ExternalLink className="size-3.5" />
                    </Link>
                    <button onClick={() => handleDeleteFile(file.name)} title="Löschen"
                      className="p-1 text-muted-foreground hover:text-red-400 rounded">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = use(params);
  const router = useRouter();
  const [bot, setBot] = useState<BotProject | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [actionState, setActionState] = useState("idle");

  useEffect(() => {
    const found = loadBots().find((b) => b.id === botId);
    if (!found) { router.push("/projects"); return; }
    setBot(found);
  }, [botId, router]);

  const updateBot = (updated: BotProject) => {
    setBot(updated);
    saveBots(loadBots().map((b) => b.id === updated.id ? updated : b));
  };

  const handleStart = async () => {
    if (!bot) return;
    setActionState("starting");
    try {
      const res = await fetch(`/api/hosting/${botId}/start`, { method: "POST" });
      updateBot({ ...bot, status: res.ok ? "running" : "error" });
    } catch { updateBot({ ...bot, status: "error" }); }
    finally { setActionState("idle"); }
  };

  const handleStop = async () => {
    if (!bot) return;
    setActionState("stopping");
    try {
      const res = await fetch(`/api/hosting/${botId}/stop`, { method: "POST" });
      if (res.ok) updateBot({ ...bot, status: "stopped" });
    } finally { setActionState("idle"); }
  };

  const handleRestart = async () => {
    if (!bot) return;
    setActionState("restarting");
    try { await fetch(`/api/hosting/${botId}/restart`, { method: "POST" }); }
    finally { setActionState("idle"); }
  };

  const handleDelete = async () => {
    setActionState("deleting");
    try { await fetch(`/api/hosting/${botId}`, { method: "DELETE" }); }
    finally {
      saveBots(loadBots().filter((b) => b.id !== botId));
      router.push("/projects");
    }
  };

  if (!bot) return null;

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview",  label: "Übersicht",     icon: Activity     },
    { key: "storage",   label: "Dateien",       icon: HardDrive    },
    { key: "packages",  label: "Pakete",        icon: Package      },
    { key: "env",       label: "Environment",   icon: KeyRound     },
    { key: "database",  label: "Datenbank",     icon: Database     },
    { key: "logs",      label: "Logs",          icon: Terminal     },
    { key: "settings",  label: "Einstellungen", icon: Settings     },
  ];

  return (
    <div className="min-h-screen">
      {/* Project header */}
      <div className="border-b border-border/70 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb + actions */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/projects"
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="size-3" />
                <span className="hidden sm:inline">Projekte</span>
              </Link>
              <ChevronRight className="size-3.5 text-border shrink-0" />
              <div className="flex items-center gap-2.5 min-w-0">
                <StatusDot status={bot.status} ping />
                <h1 className="font-semibold text-base truncate">{bot.name}</h1>
                <span className={cn(
                  "hidden sm:inline text-[11px] font-medium px-2 py-0.5 rounded-full",
                  bot.status === "running" ? "bg-emerald-400/10 text-emerald-400" :
                  bot.status === "error"   ? "bg-red-400/10 text-red-400" :
                  "bg-zinc-500/10 text-zinc-400"
                )}>
                  {STATUS_LABEL[bot.status]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/projects/${botId}/editor`}>
                <Button size="sm" className="h-7 px-3 text-[11px] gap-1.5">
                  <Code2 className="size-3" />
                  <span className="hidden sm:inline">Code Editor</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors",
                  tab === key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn("max-w-6xl mx-auto px-4 sm:px-6", tab === "database" ? "py-4" : "py-6")}>
        {tab === "overview"  && (
          <OverviewTab bot={bot} onStart={handleStart} onStop={handleStop} onRestart={handleRestart} actionState={actionState} />
        )}
        {tab === "storage"   && <StorageTab botId={botId} />}
        {tab === "packages"  && <PackagesTab botId={botId} />}
        {tab === "env"       && <EnvTab botId={botId} />}
        {tab === "database"  && <DatabaseTab botId={botId} />}
        {tab === "logs"      && <LogsTab botId={botId} />}
        {tab === "settings"  && <SettingsTab bot={bot} onUpdate={updateBot} onDelete={handleDelete} />}
      </div>
    </div>
  );
}
