import Link from "next/link";
import { Cog, Blocks, Code2, ArrowRight, Sparkles, Download, Eye } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Cog className="size-5 text-primary-foreground" />
            </div>
            <span>FlowWave</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/builder" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Builder
            </Link>
            <Link href="/generator" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Generator
            </Link>
            <Link href="/builder" className={cn(buttonVariants({ size: "sm" }))}>
              Loslegen
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center gap-8">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Discord Components V2 &amp; Pycord
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Bau Discord-Bots,{" "}
            <span className="text-muted-foreground">nicht Boilerplate.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl">
            Klick dir Slash-Commands, Modals und Components-V2-Layouts zusammen.
            Raus kommt echter Pycord-Code mit deinen Patterns. Kein Lock-in — du
            programmierst normal weiter.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/builder" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              <Blocks className="size-5" />
              Components V2 Builder
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/generator" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}>
              <Cog className="size-5" />
              Cog Generator
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Blocks className="size-5 text-primary" />
              </div>
              <CardTitle>Visual Builder</CardTitle>
              <CardDescription>
                Container, Sections, Buttons, Separators — per Drag&amp;Drop anordnen mit
                Live-Preview wie in Discord.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Code2 className="size-5 text-primary" />
              </div>
              <CardTitle>Echter Code</CardTitle>
              <CardDescription>
                Generiert sauberen Pycord-Code mit on_interaction, custom_id-Patterns
                und SQLite-Anbindung. Copy-paste ready.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Download className="size-5 text-primary" />
              </div>
              <CardTitle>Kein Lock-in</CardTitle>
              <CardDescription>
                Export als .py-Datei. Du programmierst normal weiter — FlowWave ist
                der Startpunkt, nicht das Gefängnis.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">So funktioniert&apos;s</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Zusammenklicken",
                desc: "Wähle Komponenten aus der Palette und ordne sie per Drag&Drop an.",
                icon: Blocks,
              },
              {
                step: "2",
                title: "Live-Preview",
                desc: "Sieh sofort, wie dein Layout in Discord aussehen wird.",
                icon: Eye,
              },
              {
                step: "3",
                title: "Code exportieren",
                desc: "Kopier den generierten Python-Code oder lade die .py-Datei herunter.",
                icon: Code2,
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-4">
                <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Cog className="size-4" />
            <span>FlowWave</span>
          </div>
          <p>Gebaut für die Discord-Bot-Community.</p>
        </div>
      </footer>
    </div>
  );
}
