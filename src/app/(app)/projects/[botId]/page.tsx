"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Play, Square, RotateCcw, Rocket, Code2, Terminal,
  Database, Settings, Activity, AlertCircle, CheckCircle2,
  ChevronRight, Table2, Search, RefreshCw, Trash2,
  X, Eye, EyeOff,
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

// ── DB helpers ────────────────────────────────────────────────────────────────
async function dbGet(path: string) {
  const res = await fetch(path);
  if (!res.ok) return null;
  return res.json();
}
async function dbPut(path: string, body: unknown) {
  await fetch(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
async function dbDelete(path: string) {
  await fetch(path, { method: "DELETE" });
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
    Promise.all([
      dbGet(`/api/db/projects/${botId}/files`),
      dbGet(`/api/db/projects/${botId}/env`),
    ]).then(([files, env]) => {
      let storageBytes = 0, storageFiles = 0, packages = 0, envVars = 0;
      if (Array.isArray(files)) {
        storageFiles = files.length;
        storageBytes = files.reduce((s: number, f: { content: string }) => s + new TextEncoder().encode(f.content).length, 0);
        const req = files.find((f: { name: string }) => f.name === "requirements.txt");
        if (req) packages = parseRequirements((req as { content: string }).content).length;
      }
      if (Array.isArray(env)) envVars = env.length;
      setMetrics({ storageBytes, storageFiles, packages, envVars });
    }).catch(() => {});
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
function logLineColor(line: string): string {
  const u = line.toUpperCase();
  if (u.includes("TRACEBACK") || u.includes("ERROR") || u.includes("EXCEPTION") || u.includes("CRITICAL") || u.includes("FATAL")) return "text-red-400";
  if (u.includes("WARN")) return "text-yellow-400";
  if (u.includes("SUCCESS") || u.includes("READY") || u.includes("LOGGED IN") || u.includes("CONNECTED")) return "text-emerald-400";
  if (u.includes("INFO")) return "text-blue-400";
  if (u.includes("DEBUG")) return "text-zinc-500";
  return "text-zinc-300";
}

function LogsTab({ botId, status, lastStartTime }: { botId: string; status: BotStatus; lastStartTime: number | null }) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [startupPhase, setStartupPhase] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const res = await fetch(`/api/hosting/${botId}/logs?tail=500`);
      if (res.ok) {
        const data = await res.json();
        setLines(data.logs ?? []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {} finally { if (initial) setLoading(false); }
  }, [botId]);

  useEffect(() => {
    fetchLogs(true);
    const isRecent = !!(lastStartTime && Date.now() - lastStartTime < 30_000);
    setStartupPhase(isRecent);

    let iv = setInterval(fetchLogs, isRecent ? 800 : 3000);

    if (isRecent) {
      const remaining = 30_000 - (Date.now() - lastStartTime!);
      const t = setTimeout(() => {
        clearInterval(iv);
        setStartupPhase(false);
        iv = setInterval(fetchLogs, 3000);
      }, remaining);
      return () => { clearInterval(iv); clearTimeout(t); };
    }
    return () => clearInterval(iv);
  }, [fetchLogs, lastStartTime]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Logs</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {startupPhase ? "Startphase — aktualisiert schnell" : "Aktualisiert alle 3 Sekunden"}
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5" onClick={() => fetchLogs(true)}>
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {startupPhase && status !== "error" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-[12px] text-blue-400">
          <RefreshCw className="size-3 animate-spin shrink-0" />
          Bot wird gestartet — Logs erscheinen in Kürze…
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-[12px] text-red-400">
          <AlertCircle className="size-3.5 shrink-0" />
          Bot ist abgestürzt — Fehler in den Logs unten
        </div>
      )}

      <div className="rounded-xl border border-border bg-zinc-950 dark:bg-black/60 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="size-2.5 rounded-full bg-red-500/70" />
          <div className="size-2.5 rounded-full bg-yellow-500/70" />
          <div className="size-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-zinc-500 font-mono">bot_{botId.slice(0, 8)}</span>
          <div className="ml-auto flex items-center gap-2">
            {startupPhase && <span className="text-[9px] text-blue-400 animate-pulse font-mono">● LIVE</span>}
            {status === "error" && <span className="text-[9px] text-red-400 font-mono">● CRASHED</span>}
            {status === "running" && !startupPhase && <span className="text-[9px] text-emerald-400 font-mono">● RUNNING</span>}
            <span className="text-[9px] text-zinc-600 font-mono">{lines.length} Zeilen</span>
          </div>
        </div>

        <div className="p-4 font-mono text-[11px] leading-relaxed min-h-96 max-h-[60vh] overflow-y-auto">
          {loading && lines.length === 0 ? (
            <span className="text-zinc-500">Lade Logs…</span>
          ) : lines.length === 0 ? (
            <div className="text-zinc-500 space-y-1">
              <p>$ Keine Ausgabe vorhanden.</p>
              <p className="text-zinc-600 mt-2">Mögliche Ursachen:</p>
              <p className="text-zinc-600 pl-2">· Bot ist nicht gestartet oder noch nicht deployed</p>
              <p className="text-zinc-600 pl-2">· Bot ist sofort abgestürzt (falscher Token?)</p>
              <p className="text-zinc-600 pl-2">· Hosting-API nicht erreichbar</p>
            </div>
          ) : (
            lines.map((l, i) => (
              <div key={i} className={cn("whitespace-pre-wrap break-all hover:bg-white/3 px-1 -mx-1 rounded leading-[1.6]", logLineColor(l))}>
                {l}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
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
    fetch(`/api/db/projects/${bot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: updated.name, client_id: updated.clientId }),
    });
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

  const [allFiles, setAllFiles] = useState<Array<{ name: string; content: string }>>([]);

  useEffect(() => {
    dbGet(`/api/db/projects/${botId}/files`).then((data) => {
      const files = Array.isArray(data) ? data : [];
      setAllFiles(files);
      const req = files.find((f: { name: string }) => f.name === "requirements.txt");
      setPkgs(req ? parseRequirements((req as { content: string }).content) : []);
    }).catch(() => {});
  }, [botId]);

  const persistPkgs = (next: PkgEntry[]) => {
    setPkgs(next);
    const reqContent = buildRequirements(next);
    const hasReq = allFiles.some((f) => f.name === "requirements.txt");
    const updated = hasReq
      ? allFiles.map((f) => f.name === "requirements.txt" ? { ...f, content: reqContent } : f)
      : [...allFiles, { name: "requirements.txt", content: reqContent }];
    setAllFiles(updated);
    dbPut(`/api/db/projects/${botId}/files`, updated);
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
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newHide, setNewHide] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  useEffect(() => {
    dbGet(`/api/db/projects/${botId}/env`).then((data) => { if (Array.isArray(data)) setVars(data); }).catch(() => {});
  }, [botId]);

  const persist = (next: EnvVar[]) => {
    setVars(next);
    dbPut(`/api/db/projects/${botId}/env`, next);
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
          Variablen werden in Supabase gespeichert. Im Editor per <code className="bg-muted px-1 rounded text-[11px]">os.environ[&apos;KEY&apos;]</code> verwenden.
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
interface UserColumn { name: string; type: string; }
interface UserTable { id: string; name: string; columns: UserColumn[]; created_at: string; }
interface UserRow { id: string; data: Record<string, unknown>; created_at: string; }
interface SqlResult { cols: string[]; rows: Record<string, unknown>[]; message?: string; error?: string; }

const COL_TYPES = ["TEXT", "INTEGER", "REAL", "BOOLEAN", "JSON"];

function coerceValue(v: string): unknown {
  const t = v.trim();
  if (t === "NULL" || t === "null") return null;
  if (t === "true" || t === "TRUE") return true;
  if (t === "false" || t === "FALSE") return false;
  const n = Number(t);
  if (!isNaN(n) && t !== "") return n;
  return t;
}

function parseValues(valStr: string): unknown[] {
  const values: unknown[] = [];
  let cur = "", inQuote = false;
  for (const ch of valStr) {
    if (ch === "'" && !inQuote) { inQuote = true; continue; }
    if (ch === "'" && inQuote) { inQuote = false; continue; }
    if (ch === "," && !inQuote) { values.push(coerceValue(cur)); cur = ""; }
    else cur += ch;
  }
  if (cur.trim() || !inQuote) values.push(coerceValue(cur));
  return values;
}

async function executeSQL(botId: string, sql: string): Promise<SqlResult> {
  const stmt = sql.trim().replace(/;+\s*$/, "").trim();
  const upper = stmt.toUpperCase();

  if (upper.startsWith("CREATE TABLE")) {
    const m = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]+)\)$/i);
    if (!m) return { cols: [], rows: [], error: "Ungültige CREATE TABLE Syntax. Erwartet: CREATE TABLE name (col1 TYPE, col2 TYPE)" };
    const name = m[1];
    const columns = m[2].split(",").map(c => {
      const p = c.trim().match(/^(\w+)\s+(\w+)/);
      return p ? { name: p[1], type: p[2].toUpperCase() } : null;
    }).filter(Boolean) as UserColumn[];
    if (columns.length === 0) return { cols: [], rows: [], error: "Mindestens eine Spalte erforderlich" };
    const res = await fetch(`/api/db/projects/${botId}/userdb`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, columns }),
    });
    if (!res.ok) { const e = await res.json(); return { cols: [], rows: [], error: e.error ?? "Fehler beim Erstellen" }; }
    return { cols: [], rows: [], message: `Tabelle "${name}" erstellt (${columns.length} Spalten)` };
  }

  if (upper.startsWith("DROP TABLE")) {
    const m = stmt.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
    if (!m) return { cols: [], rows: [], error: "Ungültige DROP TABLE Syntax" };
    await fetch(`/api/db/projects/${botId}/userdb/${m[1]}`, { method: "DELETE" });
    return { cols: [], rows: [], message: `Tabelle "${m[1]}" gelöscht` };
  }

  if (upper.startsWith("INSERT INTO")) {
    const m = stmt.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\((.+)\)$/i);
    if (!m) return { cols: [], rows: [], error: "Erwartet: INSERT INTO tabelle (col1, col2) VALUES (val1, val2)" };
    const colNames = m[2].split(",").map(c => c.trim());
    const vals = parseValues(m[3]);
    const data: Record<string, unknown> = {};
    colNames.forEach((c, i) => { data[c] = vals[i] ?? null; });
    const res = await fetch(`/api/db/projects/${botId}/userdb/${m[1]}/rows`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); return { cols: [], rows: [], error: e.error ?? "Fehler beim Einfügen" }; }
    return { cols: [], rows: [], message: "1 Zeile eingefügt" };
  }

  if (upper.startsWith("SELECT")) {
    const m = stmt.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?\s*$/i);
    if (!m) return { cols: [], rows: [], error: "Ungültige SELECT Syntax" };
    const selectCols = m[1].trim(), table = m[2];
    const allRows = await dbGet(`/api/db/projects/${botId}/userdb/${table}/rows`) as UserRow[] | null;
    if (!Array.isArray(allRows)) return { cols: [], rows: [], error: `Tabelle "${table}" nicht gefunden` };

    let filtered: UserRow[] = allRows;
    if (m[3]) {
      const wm = m[3].trim().match(/(\w+)\s*=\s*'?([^']+?)'?\s*$/);
      if (wm) {
        filtered = filtered.filter(r => {
          const full = { id: r.id, ...r.data, created_at: r.created_at } as Record<string, unknown>;
          return String(full[wm[1]] ?? "") === wm[2];
        });
      }
    }
    if (m[4]) filtered = filtered.slice(0, parseInt(m[4]));

    const expanded = filtered.map(r => ({ id: r.id, ...r.data, created_at: r.created_at } as Record<string, unknown>));
    const allCols = expanded.length > 0 ? Object.keys(expanded[0]) : [];
    const cols = selectCols === "*" ? allCols : selectCols.split(",").map(c => c.trim());
    const rows = expanded.map(r => Object.fromEntries(cols.map(c => [c, r[c] ?? null])));
    return { cols, rows };
  }

  if (upper.startsWith("DELETE FROM")) {
    const m = stmt.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?\s*$/i);
    if (!m) return { cols: [], rows: [], error: "Ungültige DELETE Syntax" };
    if (!m[2]) return { cols: [], rows: [], error: "DELETE ohne WHERE nicht erlaubt. Nutze DROP TABLE um alle Daten zu löschen." };
    const allRows = await dbGet(`/api/db/projects/${botId}/userdb/${m[1]}/rows`) as UserRow[] | null;
    if (!Array.isArray(allRows)) return { cols: [], rows: [], error: `Tabelle "${m[1]}" nicht gefunden` };
    const wm = m[2].trim().match(/(\w+)\s*=\s*'?([^']+?)'?\s*$/);
    if (!wm) return { cols: [], rows: [], error: "Ungültige WHERE Klausel. Erwartet: col = 'wert'" };
    const toDelete = wm[1] === "id"
      ? allRows.filter(r => r.id === wm[2])
      : allRows.filter(r => String(r.data[wm[1]] ?? "") === wm[2]);
    for (const row of toDelete) {
      await fetch(`/api/db/projects/${botId}/userdb/${m[1]}/rows`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }),
      });
    }
    return { cols: [], rows: [], message: `${toDelete.length} Zeile(n) gelöscht` };
  }

  return { cols: [], rows: [], error: "Nicht unterstützt. Verfügbare Befehle: SELECT, INSERT INTO, DELETE FROM, CREATE TABLE, DROP TABLE" };
}

function SqlEditorPanel({ botId, onRefresh }: { botId: string; onRefresh: () => void }) {
  const [sql, setSql] = useState("SELECT * FROM ");
  const [result, setResult] = useState<SqlResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (!sql.trim()) return;
    setRunning(true);
    try {
      const res = await executeSQL(botId, sql);
      setResult(res);
      if (!res.error) onRefresh();
    } finally { setRunning(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">SQL Editor</span>
        </div>
        <Button size="sm" className="h-7 text-[11px] gap-1.5" onClick={run} disabled={running || !sql.trim()}>
          {running ? <RefreshCw className="size-3 animate-spin" /> : <Play className="size-3" />}
          Ausführen
        </Button>
      </div>

      <div className="p-4 border-b border-border shrink-0">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
          rows={5}
          className="w-full bg-muted/40 border border-border rounded-lg p-3 font-mono text-[12px] leading-[1.7] resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground"
          placeholder={"SELECT * FROM users\nSELECT * FROM users WHERE name = 'Alice'\nINSERT INTO users (name, age) VALUES ('Bob', 25)\nDELETE FROM users WHERE id = 'uuid'\nCREATE TABLE orders (id TEXT, user_id TEXT, amount REAL)\nDROP TABLE orders"}
          spellCheck={false}
        />
        <p className="text-[10px] text-muted-foreground mt-1.5">⌘+Enter zum Ausführen</p>
      </div>

      <div className="flex-1 overflow-auto">
        {result ? (
          result.error ? (
            <div className="m-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
              <span className="text-[12px] text-red-400 font-mono whitespace-pre-wrap">{result.error}</span>
            </div>
          ) : result.message ? (
            <div className="m-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
              <span className="text-[12px] text-emerald-400">{result.message}</span>
            </div>
          ) : result.rows.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-[12px]">
              0 Zeilen zurückgegeben
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-border text-[10px] text-muted-foreground">
                {result.rows.length} Zeile{result.rows.length !== 1 ? "n" : ""} · {result.cols.length} Spalte{result.cols.length !== 1 ? "n" : ""}
              </div>
              <table className="w-full text-[12px] border-collapse">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    {result.cols.map((c) => (
                      <th key={c} className="text-left px-3 py-2 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
                      {result.cols.map((c) => {
                        const val = row[c];
                        const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
                        return (
                          <td key={c} className={cn("px-3 py-1.5 max-w-[240px] truncate font-mono align-top",
                            val === null || val === undefined ? "text-muted-foreground/40 italic" : "text-foreground/80")}>
                            {str || <span className="italic opacity-40">null</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center text-muted-foreground px-8">
            <Terminal className="size-8 opacity-20" />
            <div className="space-y-1 text-[11px] font-mono opacity-60 text-left">
              <p className="text-muted-foreground/80 font-sans font-medium not-italic text-[12px] mb-2">Unterstützte SQL-Befehle:</p>
              <p>SELECT * FROM tablename</p>
              <p>SELECT col1, col2 FROM t WHERE col1 = &apos;value&apos;</p>
              <p>SELECT * FROM t LIMIT 50</p>
              <p>INSERT INTO t (col1, col2) VALUES (&apos;a&apos;, 123)</p>
              <p>DELETE FROM t WHERE id = &apos;uuid&apos;</p>
              <p>CREATE TABLE t (id TEXT, name TEXT, age INTEGER)</p>
              <p>DROP TABLE tablename</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DatabaseTab({ botId }: { botId: string }) {
  const [tables, setTables] = useState<UserTable[]>([]);
  const [activeTable, setActiveTable] = useState<UserTable | null>(null);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newCols, setNewCols] = useState<UserColumn[]>([{ name: "id", type: "TEXT" }]);
  const [creating, setCreating] = useState(false);
  const [rowValues, setRowValues] = useState<Record<string, string>>({});
  const [addingRow, setAddingRow] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dbView, setDbView] = useState<"browser" | "sql">("browser");

  const loadTables = useCallback(() => {
    setLoading(true);
    dbGet(`/api/db/projects/${botId}/userdb`)
      .then((data) => { if (Array.isArray(data)) setTables(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [botId]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const loadRows = useCallback((t: UserTable) => {
    setRowsLoading(true);
    dbGet(`/api/db/projects/${botId}/userdb/${t.name}/rows`)
      .then((data) => { if (Array.isArray(data)) setRows(data); })
      .catch(() => {})
      .finally(() => setRowsLoading(false));
  }, [botId]);

  const handleSelectTable = (t: UserTable) => {
    setActiveTable(t);
    setShowCreate(false);
    setShowAddRow(false);
    loadRows(t);
  };

  const handleCreateTable = async () => {
    const name = newTableName.trim().replace(/[^a-z0-9_]/gi, "_");
    if (!name || newCols.length === 0) return;
    const validCols = newCols.filter((c) => c.name.trim());
    if (validCols.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/db/projects/${botId}/userdb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, columns: validCols }),
      });
      if (res.ok) {
        setNewTableName(""); setNewCols([{ name: "id", type: "TEXT" }]);
        setShowCreate(false);
        loadTables();
      }
    } finally { setCreating(false); }
  };

  const handleDeleteTable = async (tableName: string) => {
    await fetch(`/api/db/projects/${botId}/userdb/${tableName}`, { method: "DELETE" });
    setDeleteConfirm(null);
    if (activeTable?.name === tableName) { setActiveTable(null); setRows([]); }
    loadTables();
  };

  const handleAddRow = async () => {
    if (!activeTable) return;
    const data: Record<string, unknown> = {};
    for (const col of activeTable.columns) {
      const v = rowValues[col.name] ?? "";
      if (col.type === "INTEGER") data[col.name] = v === "" ? null : parseInt(v);
      else if (col.type === "REAL") data[col.name] = v === "" ? null : parseFloat(v);
      else if (col.type === "BOOLEAN") data[col.name] = v === "true";
      else if (col.type === "JSON") { try { data[col.name] = JSON.parse(v); } catch { data[col.name] = v; } }
      else data[col.name] = v;
    }
    setAddingRow(true);
    try {
      await fetch(`/api/db/projects/${botId}/userdb/${activeTable.name}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setRowValues({}); setShowAddRow(false);
      loadRows(activeTable);
    } finally { setAddingRow(false); }
  };

  const handleDeleteRow = async (id: string) => {
    if (!activeTable) return;
    await fetch(`/api/db/projects/${botId}/userdb/${activeTable.name}/rows`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setDbView("browser")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors",
            dbView === "browser" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <Table2 className="size-3.5" />Tabellen
        </button>
        <button
          onClick={() => setDbView("sql")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors",
            dbView === "sql" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <Terminal className="size-3.5" />SQL Editor
        </button>
      </div>

      {dbView === "sql" ? (
        <div className="h-[calc(100vh-17rem)] rounded-xl border border-border overflow-hidden">
          <SqlEditorPanel botId={botId} onRefresh={loadTables} />
        </div>
      ) : (
      <div className="flex h-[calc(100vh-17rem)] rounded-xl border border-border overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-border bg-card/40 flex flex-col">
        <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tabellen</span>
          </div>
          <button
            onClick={() => { setShowCreate(true); setActiveTable(null); setShowAddRow(false); }}
            title="Neue Tabelle"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : tables.length === 0 ? (
            <p className="text-[11px] text-muted-foreground px-3 py-4 text-center">Noch keine Tabellen</p>
          ) : tables.map((t) => (
            <div key={t.id} className="group relative">
              <button
                onClick={() => handleSelectTable(t)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors pr-8",
                  activeTable?.id === t.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Table2 className="size-3 shrink-0" />
                <span className="truncate">{t.name}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(t.name); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-border/60">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-[11px] gap-1.5"
            onClick={() => { setShowCreate(true); setActiveTable(null); setShowAddRow(false); }}
          >
            <Plus className="size-3" />
            Neue Tabelle
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-red-500/30 bg-red-500/5 shrink-0">
            <AlertCircle className="size-4 text-red-400 shrink-0" />
            <span className="text-[12px] text-red-400 flex-1">Tabelle „{deleteConfirm}" und alle Daten löschen?</span>
            <Button size="sm" className="h-7 text-[11px] bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDeleteTable(deleteConfirm)}>Löschen</Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setDeleteConfirm(null)}>Abbrechen</Button>
          </div>
        )}

        {showCreate ? (
          /* Create table form */
          <div className="flex-1 overflow-y-auto p-5">
            <div className="max-w-lg space-y-5">
              <div>
                <h3 className="text-sm font-semibold">Neue Tabelle erstellen</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Definiere Spalten und klicke auf Erstellen.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Tabellenname</Label>
                <Input
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value.replace(/[^a-z0-9_]/gi, "_"))}
                  placeholder="z.B. users"
                  className="h-8 text-[12px] font-mono"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[12px]">Spalten</Label>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] gap-1"
                    onClick={() => setNewCols((prev) => [...prev, { name: "", type: "TEXT" }])}>
                    <Plus className="size-3" />Spalte
                  </Button>
                </div>
                <div className="space-y-2">
                  {newCols.map((col, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={col.name}
                        onChange={(e) => setNewCols((prev) => prev.map((c, j) => j === i ? { ...c, name: e.target.value } : c))}
                        placeholder="spaltenname"
                        className="h-8 text-[12px] font-mono flex-1"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => setNewCols((prev) => prev.map((c, j) => j === i ? { ...c, type: e.target.value } : c))}
                        className="h-8 text-[12px] font-mono bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        {COL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {newCols.length > 1 && (
                        <button onClick={() => setNewCols((prev) => prev.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-red-400 p-1">
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1.5" onClick={handleCreateTable} disabled={creating || !newTableName.trim()}>
                  {creating ? <RefreshCw className="size-3 animate-spin" /> : <Plus className="size-3" />}
                  Erstellen
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              </div>
            </div>
          </div>
        ) : activeTable ? (
          /* Table browser */
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Table2 className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">{activeTable.name}</span>
                <span className="text-[11px] text-muted-foreground">{rows.length} Zeilen</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1.5"
                  onClick={() => loadRows(activeTable)} disabled={rowsLoading}>
                  <RefreshCw className={cn("size-3", rowsLoading && "animate-spin")} />
                  Refresh
                </Button>
                <Button size="sm" className="h-7 text-[11px] gap-1.5"
                  onClick={() => { setShowAddRow((v) => !v); setRowValues({}); }}>
                  <Plus className="size-3" />
                  Zeile hinzufügen
                </Button>
              </div>
            </div>

            {showAddRow && (
              <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                <div className="flex flex-wrap gap-2 items-end">
                  {activeTable.columns.map((col) => (
                    <div key={col.name} className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-medium">{col.name} <span className="text-muted-foreground/50">{col.type}</span></p>
                      <Input
                        value={rowValues[col.name] ?? ""}
                        onChange={(e) => setRowValues((prev) => ({ ...prev, [col.name]: e.target.value }))}
                        placeholder={col.type === "BOOLEAN" ? "true / false" : col.type}
                        className="h-7 text-[12px] font-mono w-36"
                      />
                    </div>
                  ))}
                  <Button size="sm" className="h-7 text-[11px] self-end" onClick={handleAddRow} disabled={addingRow}>
                    {addingRow ? <RefreshCw className="size-3 animate-spin" /> : "Einfügen"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              {rowsLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-[12px] gap-2">
                  <RefreshCw className="size-3.5 animate-spin" />Lade Daten…
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                  <Table2 className="size-6 opacity-30" />
                  <p className="text-[12px]">Keine Zeilen vorhanden</p>
                </div>
              ) : (
                <table className="w-full text-[12px] border-collapse">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr>
                      {activeTable.columns.map((col) => (
                        <th key={col.name} className="text-left px-3 py-2 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">
                          {col.name}
                          <span className="ml-1 text-[9px] font-normal opacity-50">{col.type}</span>
                        </th>
                      ))}
                      <th className="px-3 py-2 border-b border-border w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 hover:bg-accent/30 group transition-colors">
                        {activeTable.columns.map((col) => {
                          const val = row.data[col.name];
                          const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
                          return (
                            <td key={col.name} className={cn(
                              "px-3 py-1.5 max-w-[220px] truncate align-top",
                              val === null || val === undefined ? "text-muted-foreground/40 italic" : "text-foreground/80"
                            )}>
                              {str || <span className="italic opacity-40">null</span>}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 align-top">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity p-0.5"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center">
              <Database className="size-6 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Projektdatenbank</p>
              <p className="text-[12px] text-muted-foreground max-w-xs">
                Erstelle Tabellen für dein Projekt — keine externe Verbindung nötig.
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="size-3.5" />
              Erste Tabelle erstellen
            </Button>
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  );
}

// ── Storage Tab ───────────────────────────────────────────────────────────────
function StorageTab({ botId }: { botId: string }) {
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
    Promise.all([
      dbGet(`/api/db/projects/${botId}/files`),
      dbGet(`/api/db/projects/${botId}/folders`),
    ]).then(([f, fo]) => {
      setFiles(Array.isArray(f) ? f : []);
      setEmptyFolders(Array.isArray(fo) ? fo : []);
    }).catch(() => {});
  }, [botId]);

  useEffect(() => { load(); }, [load]);

  const saveFiles = (next: { name: string; content: string }[]) => {
    dbPut(`/api/db/projects/${botId}/files`, next);
    setFiles(next);
  };

  const saveFolders = (next: string[]) => {
    dbPut(`/api/db/projects/${botId}/folders`, next);
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
  const [lastStartTime, setLastStartTime] = useState<number | null>(null);

  useEffect(() => {
    dbGet(`/api/db/projects/${botId}`).then((data) => {
      if (!data) { router.push("/projects"); return; }
      setBot({ id: data.id, name: data.name, clientId: data.client_id, status: data.status, createdAt: data.created_at, code: "" });
    }).catch(() => router.push("/projects"));
  }, [botId, router]);

  const updateBot = (updated: BotProject) => {
    setBot(updated);
  };

  const handleStart = async () => {
    if (!bot) return;
    setActionState("starting");
    setTab("logs");
    setLastStartTime(Date.now());
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
    try {
      await Promise.all([
        fetch(`/api/hosting/${botId}`, { method: "DELETE" }),
        fetch(`/api/db/projects/${botId}`, { method: "DELETE" }),
      ]);
    } finally {
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
        {tab === "logs"      && <LogsTab botId={botId} status={bot.status} lastStartTime={lastStartTime} />}
        {tab === "settings"  && <SettingsTab bot={bot} onUpdate={updateBot} onDelete={handleDelete} />}
      </div>
    </div>
  );
}
