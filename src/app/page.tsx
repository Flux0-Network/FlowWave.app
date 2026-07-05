import Link from "next/link";
import Image from "next/image";
import { Cog, Blocks, Code2, ArrowRight, Sparkles, Download, Eye } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Inline landing header (marketing, no Navbar) ──────────────────────────────
function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center gap-8 px-6">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="FlowWave" width={120} height={40} className="h-8 w-auto object-contain" priority />
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
