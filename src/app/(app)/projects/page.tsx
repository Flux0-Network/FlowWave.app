import Link from "next/link";
import { Blocks, Cog, Plus, Clock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projekte</h1>
          <p className="text-muted-foreground">
            Deine gespeicherten Builder- und Generator-Projekte.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/builder" className={cn(buttonVariants(), "gap-1")}>
            <Plus className="size-4" />
            Neuer Builder
          </Link>
          <Link href="/generator" className={cn(buttonVariants({ variant: "outline" }), "gap-1")}>
            <Plus className="size-4" />
            Neuer Generator
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <Clock className="size-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-lg">Noch keine Projekte</CardTitle>
            <CardDescription>
              Erstelle dein erstes Projekt im Builder oder Generator.
              <br />
              Verbinde Supabase, um Projekte zu speichern und zu teilen.
            </CardDescription>
            <div className="flex justify-center gap-3 mt-4">
              <Link href="/builder" className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
                <Blocks className="size-4" />
                Components V2 Builder
              </Link>
              <Link href="/generator" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}>
                <Cog className="size-4" />
                Cog Generator
              </Link>
            </div>
          </CardHeader>
        </Card>

        <Card className="opacity-50 pointer-events-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Blocks className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Willkommensnachricht</CardTitle>
                  <CardDescription className="text-xs">
                    Components V2 Layout mit Buttons
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Builder</Badge>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
