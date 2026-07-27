import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Sparkles, ChevronRight, ChevronDown, FolderOpen, FileCode,
  Rocket, Activity, Shield, Database, KeyRound, Package, Terminal,
  Code2, LayoutDashboard, Table2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LandingAuthButton } from "@/components/layout/landing-auth-button";

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center gap-8 px-6">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="FlowWave" width={120} height={40} className="h-8 w-auto object-contain" priority />
        </Link>
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          <a href="#features" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}>
            Features
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LandingAuthButton />
        </div>
      </div>
    </header>
  );
}

// ── Editor Window Mockup ──────────────────────────────────────────────────────
const treeEntries = [
  { name: "my-bot", folder: true, open: true, depth: 0 },
  { name: "bot.py", folder: false, active: true, depth: 1 },
  { name: "cogs", folder: true, open: true, depth: 1 },
  { name: "moderation.py", folder: false, depth: 2 },
  { name: "events.py", folder: false, depth: 2 },
  { name: "requirements.txt", folder: false, depth: 1 },
  { name: ".env", folder: false, depth: 1 },
] as const;

function EditorWindow() {
  return (
    <div className="rounded-xl border border-border bg-[oklch(0.07_0.014_258)] shadow-2xl shadow-primary/10 overflow-hidden text-left">
      {/* Title bar — no macOS dots */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-black/30">
        <span className="text-[11px] text-muted-foreground/60 font-mono flex-1 text-center select-none">
          my-bot — bot.py
        </span>
      </div>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-40 shrink-0 border-r border-border/40 py-1.5 bg-black/20">
          <p className="px-3 py-1 text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-widest select-none">Explorer</p>
          {treeEntries.map((entry, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1 py-[3px] text-[11px] select-none",
                "active" in entry && entry.active ? "bg-primary/20 text-white" : "text-zinc-500"
              )}
              style={{ paddingLeft: `${6 + entry.depth * 10}px` }}
            >
              {entry.folder
                ? entry.open
                  ? <ChevronDown className="size-3 shrink-0 text-zinc-500" />
                  : <ChevronRight className="size-3 shrink-0 text-zinc-500" />
                : <span className="w-3 shrink-0" />
              }
              {entry.folder
                ? <FolderOpen className="size-3.5 shrink-0 text-amber-400/70" />
                : <FileCode className="size-3.5 shrink-0 text-blue-400/70" />
              }
              <span className="truncate leading-none">{entry.name}</span>
            </div>
          ))}
        </div>
        {/* Code */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex border-b border-border/40 bg-black/10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border/40 text-[11px]">
              <FileCode className="size-3 text-blue-400/80" />
              <span className="text-zinc-300">bot.py</span>
            </div>
          </div>
          <pre className="p-4 text-[11.5px] leading-[1.7] font-mono overflow-x-auto code-pun select-none">
            <code>
              <span className="code-kw">import</span>{" "}<span className="code-mod">discord</span>{"\n"}
              <span className="code-kw">from</span>{" "}<span className="code-mod">discord.ext</span>{" "}<span className="code-kw">import</span>{" "}<span className="code-mod">commands</span>{"\n"}
              <span className="code-kw">import</span>{" "}<span className="code-mod">os</span>{"\n\n"}
              {"intents = discord.Intents."}<span className="code-fn">default</span>{"()\n"}
              {"intents.message_content = "}<span className="code-kw">True</span>{"\n\n"}
              {"bot = commands."}<span className="code-fn">Bot</span>{"(command_prefix="}<span className="code-str">{"'!'"}</span>{", intents=intents)\n\n"}
              <span className="code-dec">{"@bot.event"}</span>{"\n"}
              <span className="code-kw">{"async def "}</span><span className="code-fn">on_ready</span>{"():\n"}
              {"    "}<span className="code-kw">print</span>{"(f"}<span className="code-str">{"'Eingeloggt als {bot.user}'"}</span>{")\n\n"}
              <span className="code-dec">{"@bot.command()"}</span>{"\n"}
              <span className="code-kw">{"async def "}</span><span className="code-fn">ping</span>{"(ctx):\n"}
              {"    "}<span className="code-kw">await</span>{" ctx."}<span className="code-fn">send</span>{"("}<span className="code-str">{"'Pong!'"}</span>{")\n\n"}
              {"bot."}<span className="code-fn">run</span>{"(os.environ["}<span className="code-str">{"'DISCORD_TOKEN'"}</span>{"])"}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Project Hub Mockup ────────────────────────────────────────────────────────
function ProjectHubWindow() {
  const tabs = ["Übersicht", "Pakete", "Environment", "Datenbank", "Logs", "Einstellungen"];
  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden text-left">
      {/* Header */}
      <div className="border-b border-border/70 bg-card/60 px-5 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-semibold text-sm">MeinBot</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">Online</span>
          </div>
          <div className="h-6 px-2.5 rounded-md bg-primary text-primary-foreground text-[11px] flex items-center gap-1">
            <Code2 className="size-3" />Code Editor
          </div>
        </div>
        <div className="flex gap-0.5 overflow-x-auto">
          {tabs.map((t, i) => (
            <span key={t} className={cn(
              "px-3 py-1.5 text-[11px] font-medium whitespace-nowrap border-b-2",
              i === 0 ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
            )}>{t}</span>
          ))}
        </div>
      </div>
      {/* Content preview */}
      <div className="p-4 space-y-2.5">
        <div className="rounded-lg border border-border bg-card/40 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-emerald-400" />
            <div>
              <p className="text-[11px] font-semibold text-emerald-400">Online</p>
              <p className="text-[10px] text-muted-foreground">Aktiv seit 3 Tagen</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="h-6 px-2 rounded border border-border text-[10px] text-muted-foreground flex items-center">Stop</div>
            <div className="h-6 px-2 rounded border border-border text-[10px] text-muted-foreground flex items-center">Restart</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[["Projekt ID", "a3f9b2…"], ["Erstellt", "24.07.2025"], ["Client ID", "12345678…"]].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-border/60 bg-card/30 px-2.5 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{l}</p>
              <p className="text-[10px] font-mono text-foreground/70 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Supabase Mockup ───────────────────────────────────────────────────────────
function DatabaseWindow() {
  const rows = [
    { id: 1, name: "Max Mustermann", role: "admin", created: "2025-07-01" },
    { id: 2, name: "Anna Schmidt",   role: "member", created: "2025-07-03" },
    { id: 3, name: "Tom Fischer",    role: "member", created: "2025-07-10" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden text-left">
      <div className="flex h-[220px]">
        {/* Sidebar */}
        <div className="w-36 shrink-0 border-r border-border bg-card/40 flex flex-col">
          <div className="px-3 py-2 border-b border-border/60 flex items-center gap-1.5">
            <Database className="size-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tabellen</span>
          </div>
          {["users", "guilds", "commands", "logs"].map((t, i) => (
            <div key={t} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[11px]", i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
              <Table2 className="size-3 shrink-0" />{t}
            </div>
          ))}
        </div>
        {/* Table */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border bg-muted/40 flex items-center gap-2">
            <Table2 className="size-3 text-muted-foreground" />
            <span className="text-[11px] font-semibold">users</span>
            <span className="text-[10px] text-muted-foreground">3 Zeilen</span>
          </div>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["id", "name", "role", "created"].map((c) => (
                  <th key={c} className="text-left px-3 py-1.5 font-semibold text-muted-foreground">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-accent/20">
                  <td className="px-3 py-1.5 text-muted-foreground">{r.id}</td>
                  <td className="px-3 py-1.5 text-foreground/80">{r.name}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium", r.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      {r.role}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground font-mono">{r.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Feature cards ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: LayoutDashboard,
    title: "Project Hub",
    description: "Jedes Projekt hat eine eigene Seite mit Übersicht, Logs, Einstellungen und mehr — wie bei Vercel.",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Code2,
    title: "Code Editor",
    description: "Vollständiger Editor mit Syntax-Highlighting, Multi-File-Support, Umbenennen, Löschen und Tab-Ansicht.",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    icon: Package,
    title: "Pakete-Hub",
    description: "Python-Pakete direkt verwalten. Spezifische Versionen angeben — schreibt automatisch in requirements.txt.",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
  },
  {
    icon: Database,
    title: "Supabase Browser",
    description: "Datenbanktabellen direkt in FlowWave durchsuchen, filtern und per SQL-Editor abfragen.",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    icon: KeyRound,
    title: "Environment Variables",
    description: "Secrets und API-Keys sicher pro Projekt verwalten. Werte verbergen, bearbeiten, kopieren.",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
  {
    icon: Terminal,
    title: "Live Logs",
    description: "Bot-Logs live mitsehen, Status auf einen Blick. Stop, Restart und Deploy direkt im Dashboard.",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
  },
];

const steps = [
  { n: "1", title: "Projekt anlegen", desc: "Bot-Name eingeben, Pakete wählen und direkt loslegen — kein Setup nötig." },
  { n: "2", title: "Code & Umgebung", desc: "Code im Editor schreiben, Pakete installieren, Secrets verwalten." },
  { n: "3", title: "Deploy & Monitor", desc: "Ein Klick deploy. Logs live sehen, Status immer im Blick." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden hero-glow">
          <div className="container mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 max-w-lg">
              <Badge variant="secondary" className="gap-1.5 w-fit border border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="size-3" />
                Project Hub · Discord · Supabase · Python
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]" style={{ textWrap: "balance" }}>
                Alles für deinen Bot,{" "}
                <span className="text-muted-foreground">an einem Ort.</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Code Editor, Pakete, Secrets, Datenbank und Deploy — alles direkt in FlowWave.
                Kein VPS, kein Headache.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/projects" className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/25")}>
                  Jetzt starten
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <EditorWindow />
            </div>
          </div>
        </section>

        {/* Project Hub showcase */}
        <section className="border-y border-border/60 bg-muted/20 py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <Badge variant="secondary" className="mb-3 border border-border">Neu</Badge>
              <h2 className="text-2xl font-bold tracking-tight">Project Hub</h2>
              <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
                Jedes Projekt hat seine eigene Seite — mit allen Tools auf einen Blick.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="space-y-3">
                <ProjectHubWindow />
                <p className="text-[12px] text-muted-foreground text-center">Übersicht mit Status, Quick-Actions und Deploy</p>
              </div>
              <div className="space-y-3">
                <DatabaseWindow />
                <p className="text-[12px] text-muted-foreground text-center">Supabase Table Browser direkt im Dashboard</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-3 tracking-tight">Alles was du brauchst</h2>
          <p className="text-muted-foreground text-sm text-center mb-10 max-w-md mx-auto">
            Von Code bis Deploy — FlowWave ist die einzige Plattform, die du brauchst.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3.5 hover:border-primary/30 transition-colors"
              >
                <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", f.iconBg)}>
                  <f.icon className={cn("size-4", f.iconColor)} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="container mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12 tracking-tight">So einfach geht&apos;s</h2>
          <div className="relative grid md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-5 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-4">
                <div className="relative size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-md shadow-primary/30">
                  {s.n}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60 bg-muted/20 py-16">
          <div className="container mx-auto px-6 text-center space-y-5">
            <h2 className="text-3xl font-bold tracking-tight">Bereit loszulegen?</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Kostenlos starten. Kein Kreditkarte, kein Setup.
            </p>
            <Link href="/projects" className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/25")}>
              Projekt erstellen
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-7">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="FlowWave" width={80} height={24} className="h-5 w-auto object-contain" />
          </div>
          <p>Gebaut für die Discord-Bot-Community.</p>
          <p className="text-xs text-muted-foreground/50">Powered by Flux Network</p>
        </div>
      </footer>
    </div>
  );
}
