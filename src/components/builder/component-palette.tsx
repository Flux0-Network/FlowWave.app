"use client";

import {
  Box,
  LayoutList,
  Type,
  MousePointerClick,
  Minus,
  Image,
  Images,
  Rows3,
  List,
} from "lucide-react";
import type { ComponentType } from "@/types/builder";
import { cn } from "@/lib/utils";

interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: React.ElementType;
  description: string;
  iconBg: string;
  iconColor: string;
}

const paletteItems: PaletteItem[] = [
  {
    type: "container",
    label: "Container",
    icon: Box,
    description: "Wrapping-Block mit Accent-Farbe",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    type: "section",
    label: "Section",
    icon: LayoutList,
    description: "Sektion mit Text und Accessory",
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-400",
  },
  {
    type: "text-display",
    label: "Text Display",
    icon: Type,
    description: "Markdown-Text anzeigen",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
  },
  {
    type: "button",
    label: "Button",
    icon: MousePointerClick,
    description: "Interaktiv mit custom_id oder URL",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    type: "separator",
    label: "Separator",
    icon: Minus,
    description: "Visueller Trenner",
    iconBg: "bg-zinc-500/15",
    iconColor: "text-zinc-400",
  },
  {
    type: "thumbnail",
    label: "Thumbnail",
    icon: Image,
    description: "Kleines Vorschaubild",
    iconBg: "bg-pink-500/15",
    iconColor: "text-pink-400",
  },
  {
    type: "media-gallery",
    label: "Media Gallery",
    icon: Images,
    description: "Bildergalerie",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
  },
  {
    type: "action-row",
    label: "Action Row",
    icon: Rows3,
    description: "Reihe für Buttons & Selects",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
  {
    type: "select-menu",
    label: "Select Menu",
    icon: List,
    description: "Dropdown: String, User, Role …",
    iconBg: "bg-orange-500/15",
    iconColor: "text-orange-400",
  },
];

interface ComponentPaletteProps {
  onAdd: (type: ComponentType) => void;
}

export function ComponentPalette({ onAdd }: ComponentPaletteProps) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
        Komponenten
      </p>
      <div className="flex flex-col gap-0.5">
        {paletteItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onAdd(item.type)}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
          >
            <div className={cn("size-7 rounded-md flex items-center justify-center shrink-0", item.iconBg)}>
              <item.icon className={cn("size-3.5", item.iconColor)} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-[13px] leading-tight">{item.label}</div>
              <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
