"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Cog,
  Eye,
} from "lucide-react";

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
    author: "Flowcord",
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
    author: "Flowcord",
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
    author: "Flowcord",
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
    <div className="container px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cog Marketplace</h1>
        <p className="text-muted-foreground">
          Entdecke fertige Cogs von der Community — installiere sie mit einem Klick
          oder nutze sie als Startpunkt.
        </p>
      </div>

      {/* Featured */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Featured</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {featured.map((cog) => (
            <Card key={cog.id} className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <cog.icon className="size-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {cog.name}
                        <Badge className="text-xs">Featured</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">von {cog.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="size-4 fill-current" />
                    <span className="text-sm font-medium">{cog.rating}</span>
                  </div>
                </div>
                <CardDescription className="mt-2">{cog.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="size-3.5" />
                      {cog.downloads.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3.5" />
                      {cog.likes}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Eye className="size-3.5" />
                      Preview
                    </Button>
                    <Button size="sm" className="gap-1">
                      <Download className="size-3.5" />
                      Installieren
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cogs durchsuchen..."
            className="pl-10"
          />
        </div>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Cog Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cog) => (
          <Card key={cog.id} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                  <cog.icon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm">{cog.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">von {cog.author}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="size-3 fill-current" />
                  <span className="text-xs">{cog.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {cog.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {cog.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
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
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Cog className="size-3" />
                  Nutzen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="size-8 mx-auto mb-4 opacity-50" />
          <p>Keine Cogs gefunden für &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
