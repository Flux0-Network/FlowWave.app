import Link from "next/link";
import { Cog, Blocks, Code2, ArrowRight, Sparkles, Download, Eye, Waves } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Inline landing header (marketing, no Navbar) ──────────────────────────────
function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-base shrink-0">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_oklch(0.545_0.24_264/0.5)]">
            <Waves className="size-4 text-primary-foreground" />
          </div>
          <span className="tracking-tight">FlowWave</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          <Link href="/builder" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}>
            Builder
          </Link>
          <Link href="/marketplace" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}>
            Marketplace
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/builder" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            Loslegen
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Code preview window ───────────────────────────────────────────────────────
function CodeWindow() {
  return (
    <div className="rounded-xl border border-border bg-[oklch(0.07_0.014_258)] shadow-2xl shadow-primary/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-muted/30">
        <span className="text-[11px] text-muted-foreground font-mono tracking-wide">flowwave_bot.py</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Python</span>
      </div>
      {/* Syntax-coloured Python */}
      <pre className="p-5 text-[12.5px] leading-[1.7] font-mono overflow-x-auto code-pun select-none">
        <code>
          <span className="code-kw">import</span>{" "}
          <span className="code-mod">discord</span>{"\n\n"}
          <span className="code-kw">class</span>{" "}
          <span className="code-cls">WelcomeView</span>
          {"("}
          <span className="code-mod">discord.ui</span>
          {"."}
          <span className="code-fn">DesignerView</span>
          {"):\n"}
          {"    "}
          <span className="code-pun">container</span>
          {" = "}
          <span className="code-mod">discord.ui</span>
          {"."}
          <span className="code-fn">Container</span>
          {"(\n"}
          {"        "}
          <span className="code-mod">discord.ui</span>
          {"."}
          <span className="code-fn">TextDisplay</span>
          {"("}
          <span className="code-str">{"\"# 👋 Willkommen!\""}</span>
          {"),\n"}
          {"        "}
          <span className="code-mod">discord.ui</span>
          {"."}
          <span className="code-fn">ActionRow</span>
          {"(\n"}
          {"            "}
          <span className="code-mod">discord.ui</span>
          {"."}
          <span className="code-fn">Button</span>
          {"(\n"}
          {"                label="}
          <span className="code-str">{"\"Rolle wählen\""}</span>
          {",\n"}
          {"                style="}
          <span className="code-mod">discord.ButtonStyle</span>
          {"."}
          <span className="code-dec">primary</span>
          {",\n"}
          {"                custom_id="}
          <span className="code-str">{"\"pick_role\""}</span>
          {",\n"}
          {"            ),\n"}
          {"        ),\n"}
          {"        accent_colour="}
          <span className="code-mod">discord.Color</span>
          {"."}
          <span className="code-fn">blurple</span>
          {"(),\n"}
          {"    )\n\n"}
          {"    "}
          <span className="code-dec">@discord.ui.button</span>
          {"(custom_id="}
          <span className="code-str">{"\"pick_role\""}</span>
          {")\n"}
          {"    "}
          <span className="code-kw">async def</span>
          {" "}
          <span className="code-fn">on_pick_role</span>
          {"(self, btn, interaction):\n"}
          {"        "}
          <span className="code-kw">await</span>
          {" interaction.response."}
          <span className="code-fn">send_message</span>
          {"(\n"}
          {"            "}
          <span className="code-str">{"\"Rolle vergeben!\""}</span>
          {", ephemeral="}
          <span className="code-kw">True</span>
          {"\n        )"}
        </code>
      </pre>
    </div>
  );
}

// ── Feature cards ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: Blocks,
    title: "Visual Builder",
    description: "Container, Sections, Buttons, Select-Menüs — per Drag & Drop anordnen mit Live-Preview wie in Discord.",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Code2,
    title: "Echter Pycord-Code",
    description: "Generiert sauberes Pycord v2.8-Python mit DesignerView, on_interaction, custom_id-Patterns und SQLite-Anbindung.",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    icon: Download,
    title: "Kein Lock-in",
    description: "Export als .py-Datei. Du programmierst normal weiter — FlowWave ist der Startpunkt, nicht das Gefängnis.",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
const steps = [
  { n: "1", title: "Zusammenklicken", desc: "Wähle Komponenten aus der Palette und ordne sie per Drag & Drop an.", icon: Blocks },
  { n: "2", title: "Live-Preview", desc: "Sieh sofort, wie dein Layout in Discord aussehen wird.", icon: Eye },
  { n: "3", title: "Code exportieren", desc: "Kopier den generierten Python-Code oder lade die .py-Datei herunter.", icon: Code2 },
];

// ── Page ──────────────────────────────────────────────────────────────────────
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
                Discord Components V2 · Pycord v2.8
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]" style={{ textWrap: "balance" }}>
                Bau Discord-Bots,{" "}
                <span className="text-muted-foreground">nicht Boilerplate.</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Klick dir Slash-Commands, Modals und Components-V2-Layouts zusammen.
                Raus kommt echter Pycord-Code mit deinen Patterns. Kein Lock-in.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/builder" className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/25")}>
                  <Blocks className="size-5" />
                  Components V2 Builder
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/builder" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}>
                  <Cog className="size-5" />
                  Cog Generator
                </Link>
              </div>
            </div>

            {/* Code preview */}
            <div className="hidden md:block">
              <CodeWindow />
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
            So funktioniert&apos;s
          </h2>
          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connector line on desktop */}
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
            <Waves className="size-4 text-primary" />
            <span className="font-medium text-foreground">FlowWave</span>
          </div>
          <p>Gebaut für die Discord-Bot-Community.</p>
        </div>
      </footer>
    </div>
  );
}
