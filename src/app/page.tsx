import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileCode,
  Shield,
  Activity,
  Rocket,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center gap-8 px-6">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="CogsForge" width={120} height={40} className="h-8 w-auto object-contain" priority />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          <Link href="/marketplace" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}>
            Marketplace
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/projects" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            Loslegen
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── File tree entries ─────────────────────────────────────────────────────
const treeEntries = [
  { name: "my-bot", folder: true, open: true, depth: 0 },
  { name: "bot.py", folder: false, active: true, depth: 1 },
  { name: "cogs", folder: true, open: true, depth: 1 },
  { name: "moderation.py", folder: false, depth: 2 },
  { name: "events.py", folder: false, depth: 2 },
  { name: "requirements.txt", folder: false, depth: 1 },
  { name: ".env", folder: false, depth: 1 },
] as const;

function VSCodeWindow() {
  return (
    <div className="rounded-xl border border-border bg-[oklch(0.07_0.014_258)] shadow-2xl shadow-primary/10 overflow-hidden text-left">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-black/30">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[11px] text-muted-foreground/60 font-mono flex-1 text-center select-none">
          my-bot — bot.py
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-40 shrink-0 border-r border-border/40 py-1.5 bg-black/20">
          <p className="px-3 py-1 text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-widest select-none">
            Explorer
          </p>
          {treeEntries.map((entry, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1 py-[3px] text-[11px] select-none",
                "active" in entry && entry.active
                  ? "bg-primary/20 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              style={{ paddingLeft: `${6 + entry.depth * 10}px` }}
            >
              {entry.folder ? (
                entry.open ? (
                  <ChevronDown className="size-3 shrink-0 text-zinc-500" />
                ) : (
                  <ChevronRight className="size-3 shrink-0 text-zinc-500" />
                )
              ) : (
                <span className="w-3 shrink-0" />
              )}
              {entry.folder ? (
                <FolderOpen className="size-3.5 shrink-0 text-amber-400/70" />
              ) : (
                <FileCode className="size-3.5 shrink-0 text-blue-400/70" />
              )}
              <span className="truncate leading-none">{entry.name}</span>
            </div>
          ))}
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border/40 bg-black/10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border/40 text-[11px]">
              <FileCode className="size-3 text-blue-400/80" />
              <span className="text-zinc-300">bot.py</span>
            </div>
          </div>
          {/* Code */}
          <pre className="p-4 text-[11.5px] leading-[1.7] font-mono overflow-x-auto code-pun select-none">
            <code>
              <span className="code-kw">import</span>{" "}
              <span className="code-mod">discord</span>{"\n"}
              <span className="code-kw">from</span>{" "}
              <span className="code-mod">discord.ext</span>{" "}
              <span className="code-kw">import</span>{" "}
              <span className="code-mod">commands</span>{"\n"}
              <span className="code-kw">import</span>{" "}
              <span className="code-mod">os</span>{"\n\n"}
              {"intents = discord.Intents."}
              <span className="code-fn">default</span>{"()\n"}
              {"intents.message_content = "}
              <span className="code-kw">True</span>{"\n\n"}
              {"bot = commands."}
              <span className="code-fn">Bot</span>
              {"(command_prefix="}
              <span className="code-str">{"'!'"}</span>
              {", intents=intents)\n\n"}
              <span className="code-dec">{"@bot.event"}</span>{"\n"}
              <span className="code-kw">{"async def "}</span>
              <span className="code-fn">on_ready</span>{"():\n"}
              {"    "}
              <span className="code-kw">print</span>
              {"(f"}
              <span className="code-str">{"'Eingeloggt als {bot.user}'"}</span>
              {"\n\n"}
              <span className="code-dec">{"@bot.command()"}</span>{"\n"}
              <span className="code-kw">{"async def "}</span>
              <span className="code-fn">ping</span>{"(ctx):\n"}
              {"    "}
              <span className="code-kw">await</span>
              {" ctx."}
              <span className="code-fn">send</span>
              {"("}
              <span className="code-str">{"'Pong!'"}</span>
              {")\n\n"}
              {"bot."}
              <span className="code-fn">run</span>
              {"(os.environ["}
              <span className="code-str">{"'DISCORD_TOKEN'"}</span>
              {"])"}  
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Rocket,
    title: "Deploy in Sekunden",
    description: "Token eingeben, Bot startet sofort in einem isolierten Container. Kein VPS, kein Server-Setup, kein Stress.",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Activity,
    title: "24/7 Monitoring",
    description: "Logs live mitsehen, Status auf einen Blick. Stop, Restart und alles andere per Klick direkt im Dashboard.",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    icon: Shield,
    title: "Token-sicher",
    description: "Dein Bot-Token wird verschlüsselt gespeichert und verlässt den Server nie im Klartext. Deine Daten, deine Kontrolle.",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
];

const steps = [
  { n: "1", title: "Bot verbinden", desc: "Bot-Name und Discord-Token eingeben — das war’s." },
  { n: "2", title: "Einmal deployen", desc: "Ein Klick, und dein Bot startet in einem isolierten Container." },
  { n: "3", title: "24/7 online", desc: "Dein Bot läuft dauerhaft. Logs, Stop, Restart — alles per Klick." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden hero-glow">
          <div className="container mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="flex flex-col gap-6 max-w-lg">
              <Badge variant="secondary" className="gap-1.5 w-fit border border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="size-3" />
                Discord Bot Hosting · Python 3.14
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]" style={{ textWrap: "balance" }}>
                Dein Discord-Bot,{" "}
                <span className="text-muted-foreground">24/7 am Leben.</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Deploy deinen Python-Bot mit einem Klick — wie Vercel, aber für Discord-Bots.
                Token rein, Bot läuft. Kein VPS, kein Headache.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/projects" className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/25")}>
                  Bot deployen
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* VS Code window */}
            <div className="hidden md:block">
              <VSCodeWindow />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors"
              >
                <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", f.iconBg)}>
                  <f.icon className={cn("size-5", f.iconColor)} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="container mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-12 tracking-tight">
            So einfach geht&apos;s
          </h2>
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
      </main>

      <footer className="border-t border-border py-7">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="CogsForge" width={80} height={24} className="h-5 w-auto object-contain" />
          </div>
          <p>Gebaut für die Discord-Bot-Community.</p>
        </div>
      </footer>
    </div>
  );
}
