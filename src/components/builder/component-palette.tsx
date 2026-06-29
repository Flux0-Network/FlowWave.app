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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComponentType } from "@/types/builder";

interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const paletteItems: PaletteItem[] = [
  {
    type: "container",
    label: "Container",
    icon: Box,
    description: "Wrapping-Container mit optionaler Accent-Farbe",
  },
  {
    type: "section",
    label: "Section",
    icon: LayoutList,
    description: "Layout-Sektion mit Text und optionalem Accessory",
  },
  {
    type: "text-display",
    label: "Text Display",
    icon: Type,
    description: "Markdown-Text anzeigen",
  },
  {
    type: "button",
    label: "Button",
    icon: MousePointerClick,
    description: "Interaktiver Button mit custom_id oder URL",
  },
  {
    type: "separator",
    label: "Separator",
    icon: Minus,
    description: "Visueller Trenner zwischen Komponenten",
  },
  {
    type: "thumbnail",
    label: "Thumbnail",
    icon: Image,
    description: "Kleines Vorschaubild",
  },
  {
    type: "media-gallery",
    label: "Media Gallery",
    icon: Images,
    description: "Bildergalerie mit mehreren Medien",
  },
  {
    type: "action-row",
    label: "Action Row",
    icon: Rows3,
    description: "Reihe für Buttons und Select-Menüs",
  },
  {
    type: "select-menu",
    label: "Select Menu",
    icon: List,
    description: "Dropdown: String, User, Role, Channel oder Mentionable",
  },
];

interface ComponentPaletteProps {
  onAdd: (type: ComponentType) => void;
}

export function ComponentPalette({ onAdd }: ComponentPaletteProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Komponenten</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        {paletteItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onAdd(item.type)}
            className="flex items-center gap-3 rounded-md border p-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground truncate">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
