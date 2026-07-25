"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Play, Square, RotateCcw, Rocket, Code2, Terminal,
  Database, Settings, Activity, Clock, AlertCircle, CheckCircle2,
  ChevronRight, Table2, Search, RefreshCw, Plug, Trash2,
  ChevronLeft, ChevronRight as ChevronRightIcon, X, Eye, EyeOff,
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

type Tab = "overview" | "database" | "logs" | "settings";

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
    { key: "overview", label: "Übersicht", icon: Activity },
    { key: "database", label: "Datenbank", icon: Database },
    { key: "logs", label: "Logs", icon: Terminal },
    { key: "settings", label: "Einstellungen", icon: Settings },
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
        {tab === "overview" && (
          <OverviewTab
            bot={bot}
            onStart={handleStart}
            onStop={handleStop}
            onRestart={handleRestart}
            actionState={actionState}
          />
        )}
        {tab === "database" && <DatabaseTab botId={botId} />}
        {tab === "logs" && <LogsTab botId={botId} />}
        {tab === "settings" && <SettingsTab bot={bot} onUpdate={updateBot} onDelete={handleDelete} />}
      </div>
    </div>
  );
}
