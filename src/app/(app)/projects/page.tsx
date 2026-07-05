import Link from "next/link";
import { Blocks, Cog, Plus, Clock, FolderOpen, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  return (
    <div className="py-10 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gespeicherte Builder- und Generator-Projekte.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/builder" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            <Plus className="size-3.5" />
            Builder
          </Link>
          <Link href="/generator" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <Plus className="size-3.5" />
            Generator
          </Link>
        </div>
      </div>

      {/* Empty state */}
      <div className="rounded-xl border border-dashed border-border bg-card/40 px-8 py-14 flex flex-col items-center text-center gap-5">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          <FolderOpen className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="font-semibold">Noch keine Projekte</h2>
          <p className="text-sm text-muted-foreground">
            Erstelle dein erstes Projekt im Builder oder Generator.
            Verbinde Supabase, um Projekte zu speichern.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-1">
          <Link href="/builder" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            <Blocks className="size-3.5" />
            Components V2 Builder
            <ArrowRight className="size-3.5" />
          </Link>
          <Link href="/generator" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <Cog className="size-3.5" />
            Cog Generator
          </Link>
        </div>
      </div>

      {/* Recent (placeholder, dimmed) */}
      <div className="mt-6">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Zuletzt bearbeitet
        </p>
        <div className="space-y-2 opacity-40 pointer-events-none select-none">
          {[
            { title: "Willkommensnachricht", type: "Builder", icon: Blocks },
            { title: "ModerationCog", type: "Generator", icon: Cog },
          ].map((p) => (
            <div
              key={p.title}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                <p.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="size-3" />
                  Vor 2 Tagen
                </p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">{p.type}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
