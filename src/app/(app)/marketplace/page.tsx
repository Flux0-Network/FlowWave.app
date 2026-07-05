"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  Heart,
  Star,
  Shield,
  Ticket,
  UserPlus,
  BarChart3,
  Music,
  Gamepad2,
  Bell,
  MessageSquare,
  Eye,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketplaceCog {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  downloads: number;
  likes: number;
  rating: number;
  icon: React.ElementType;
  tags: string[];
  featured?: boolean;
}

const marketplaceCogs: MarketplaceCog[] = [
  {
    id: "welcome-pro",
    name: "Welcome Pro",
    description: "Vollständiges Willkommenssystem mit Rollen-Auswahl, DM-Begrüßung und Captcha-Verifikation.",
    author: "FlowWave",
    category: "utility",
    downloads: 1247,
    likes: 89,
    rating: 4.8,
    icon: UserPlus,
    tags: ["welcome", "roles", "captcha"],
    featured: true,
  },
  {
    id: "ticket-system",
    name: "Ticket System",
    description: "Support-Tickets mit Kategorien, Transkripten und automatischem Archiv.",
    author: "FlowWave",
    category: "moderation",
    downloads: 2341,
    likes: 156,
    rating: 4.9,
    icon: Ticket,
    tags: ["ticket", "support", "moderation"],
    featured: true,
  },
  {
    id: "mod-toolkit",
    name: "Mod Toolkit",
    description: "Warn-System, Auto-Mod, Logs und Moderationsstatistiken in einem Cog.",
    author: "ModderMax",
    category: "moderation",
    downloads: 1893,
    likes: 134,
    rating: 4.7,
    icon: Shield,
    tags: ["moderation", "warns", "logs", "automod"],
  },
  {
    id: "poll-master",
    name: "Poll Master",
    description: "Umfragen mit Multiple Choice, Zeitlimit und Live-Ergebnissen.",
    author: "PollDev",
    category: "utility",
    downloads: 876,
    likes: 67,
    rating: 4.5,
    icon: BarChart3,
    tags: ["poll", "voting", "umfrage"],
  },
  {
    id: "music-player",
    name: "Music Player",
    description: "YouTube/Spotify Musik-Bot mit Queue, Loop und Lautstärkeregelung.",
    author: "AudioDev",
    category: "entertainment",
    downloads: 3456,
    likes: 234,
    rating: 4.6,
    icon: Music,
    tags: ["music", "youtube", "spotify"],
  },
  {
    id: "leveling",
    name: "Leveling System",
    description: "XP-System mit Leveln, Leaderboard und Rollenbelohnungen.",
    author: "GameDevs",
    category: "entertainment",
    downloads: 2134,
    likes: 178,
    rating: 4.7,
    icon: Gamepad2,
    tags: ["leveling", "xp", "leaderboard"],
  },
  {
    id: "announcer",
    name: "Smart Announcer",
    description: "Geplante Ankündigungen mit Embeds, Mentions und Wiederholungen.",
    author: "FlowWave",
    category: "utility",
    downloads: 567,
    likes: 45,
    rating: 4.4,
    icon: Bell,
    tags: ["announcement", "scheduler", "embed"],
  },
  {
    id: "feedback-collector",
    name: "Feedback Collector",
    description: "Feedback-System mit Modals, Kategorisierung und Export.",
    author: "FeedbackBot",
    category: "utility",
    downloads: 432,
    likes: 34,
    rating: 4.3,
    icon: MessageSquare,
    tags: ["feedback", "modal", "survey"],
  },
];

const categories = [
  { value: "all", label: "Alle" },
  { value: "utility", label: "Utility" },
  { value: "moderation", label: "Moderation" },
  { value: "entertainment", label: "Entertainment" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="size-3 fill-amber-400 text-amber-400" />
      <span className="text-xs font-medium tabular-nums">{rating}</span>
    </div>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = marketplaceCogs.filter((cog) => {
    const matchesSearch =
      !search ||
      cog.name.toLowerCase().includes(search.toLowerCase()) ||
      cog.description.toLowerCase().includes(search.toLowerCase()) ||
      cog.tags.some((t) => t.includes(search.toLowerCase()));
    const matchesCategory = category === "all" || cog.category === category;
    return matchesSearch && matchesCategory;
  });

  const featured = marketplaceCogs.filter((c) => c.featured);

  return (
    <div className="py-8 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Marketplace</h1>
        <p className="text-muted-foreground">
          Fertige Cogs von der Community — sofort einsatzbereit oder als Startpunkt.
        </p>
      </div>

      {/* Featured */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {featured.map((cog) => (
            <div
              key={cog.id}
              className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 to-card p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <cog.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{cog.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-primary/30 bg-primary/10 text-primary">
                        Featured
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">von {cog.author}</p>
                  </div>
                </div>
                <StarRating rating={cog.rating} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{cog.description}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="size-3" />
                    {cog.downloads.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3" />
                    {cog.likes}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Eye className="size-3" />
                    Preview
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1">
                    <Download className="size-3" />
                    Installieren
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cogs durchsuchen..."
            className="pl-9 h-9"
          />
        </div>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="h-9">
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs px-3">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cog) => (
          <Card
            key={cog.id}
            className={cn(
              "border-border hover:border-primary/30 transition-colors",
              "flex flex-col"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <cog.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-[13px] leading-tight">{cog.name}</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">von {cog.author}</p>
                </div>
                <StarRating rating={cog.rating} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <CardDescription className="text-xs leading-relaxed line-clamp-2">
                {cog.description}
              </CardDescription>
              <div className="flex flex-wrap gap-1">
                {cog.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 mt-auto">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Download className="size-3" />
                    {cog.downloads.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Heart className="size-3" />
                    {cog.likes}
                  </span>
                </div>
                <Button size="sm" className="h-7 text-xs gap-1">
                  <Download className="size-3" />
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="size-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Keine Cogs gefunden für &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
