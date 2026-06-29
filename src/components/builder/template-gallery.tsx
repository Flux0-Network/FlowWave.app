"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Ticket, Shield, BarChart3, UserPlus, Bell } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  components: BuilderComponent[];
}

let tplId = 1000;
function tid() {
  tplId++;
  return `tpl_${tplId}`;
}

const templates: Template[] = [
  {
    id: "welcome",
    name: "Willkommensnachricht",
    description: "Container mit Begrüßungstext und Rollen-Buttons",
    icon: UserPlus,
    components: [
      {
        id: tid(),
        type: "container",
        props: { accent_color: "#57F287" },
        children: [
          {
            id: tid(),
            type: "text-display",
            props: { content: "**Willkommen auf dem Server!** 🎉\n\nWähle deine Rollen aus, um loszulegen." },
          },
          {
            id: tid(),
            type: "separator",
            props: { divider: true, spacing: "small" },
          },
          {
            id: tid(),
            type: "action-row",
            props: {},
            children: [
              {
                id: tid(),
                type: "button",
                props: { label: "🎮 Gamer", style: "primary", custom_id: "role_gamer" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "🎨 Kreativ", style: "secondary", custom_id: "role_kreativ" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "💻 Developer", style: "success", custom_id: "role_dev" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ticket",
    name: "Ticket-System",
    description: "Support-Ticket mit Kategorie-Auswahl und Erstellen-Button",
    icon: Ticket,
    components: [
      {
        id: tid(),
        type: "container",
        props: { accent_color: "#5865F2" },
        children: [
          {
            id: tid(),
            type: "text-display",
            props: { content: "**📩 Support-Tickets**\n\nBrauchst du Hilfe? Erstelle ein Ticket!" },
          },
          {
            id: tid(),
            type: "separator",
            props: { divider: true, spacing: "small" },
          },
          {
            id: tid(),
            type: "select-menu",
            props: {
              select_type: "string",
              custom_id: "ticket_category",
              placeholder: "Kategorie wählen...",
              min_values: 1,
              max_values: 1,
              options: [
                { label: "Allgemeine Frage", value: "general", description: "Allgemeine Hilfe", emoji: "❓" },
                { label: "Bug Report", value: "bug", description: "Fehler melden", emoji: "🐛" },
                { label: "Feature Request", value: "feature", description: "Neues Feature vorschlagen", emoji: "💡" },
              ],
            },
          },
          {
            id: tid(),
            type: "action-row",
            props: {},
            children: [
              {
                id: tid(),
                type: "button",
                props: { label: "🎫 Ticket erstellen", style: "primary", custom_id: "create_ticket" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "modpanel",
    name: "Moderations-Panel",
    description: "Mod-Actions mit Warn, Mute und Ban Buttons",
    icon: Shield,
    components: [
      {
        id: tid(),
        type: "container",
        props: { accent_color: "#ED4245" },
        children: [
          {
            id: tid(),
            type: "text-display",
            props: { content: "**🛡️ Moderations-Panel**\n\nWähle eine Aktion:" },
          },
          {
            id: tid(),
            type: "action-row",
            props: {},
            children: [
              {
                id: tid(),
                type: "button",
                props: { label: "⚠️ Warn", style: "secondary", custom_id: "mod_warn" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "🔇 Mute", style: "primary", custom_id: "mod_mute" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "🔨 Ban", style: "danger", custom_id: "mod_ban" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "poll",
    name: "Umfrage",
    description: "Poll mit Abstimmungsbuttons und Ergebnis-Anzeige",
    icon: BarChart3,
    components: [
      {
        id: tid(),
        type: "container",
        props: { accent_color: "#FEE75C" },
        children: [
          {
            id: tid(),
            type: "text-display",
            props: { content: "**📊 Umfrage**\n\nWas ist euer Lieblings-Programmiersprache?" },
          },
          {
            id: tid(),
            type: "separator",
            props: { divider: true, spacing: "small" },
          },
          {
            id: tid(),
            type: "action-row",
            props: {},
            children: [
              {
                id: tid(),
                type: "button",
                props: { label: "🐍 Python", style: "success", custom_id: "poll_python" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "🟨 JavaScript", style: "primary", custom_id: "poll_js" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "🦀 Rust", style: "danger", custom_id: "poll_rust" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "☕ Java", style: "secondary", custom_id: "poll_java" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "announcement",
    name: "Ankündigung",
    description: "Server-Ankündigung mit Benachrichtigungs-Rollen",
    icon: Bell,
    components: [
      {
        id: tid(),
        type: "container",
        props: { accent_color: "#EB459E" },
        children: [
          {
            id: tid(),
            type: "text-display",
            props: { content: "**📢 Ankündigung**\n\nNeues Update ist live! Schaut in die Patch Notes." },
          },
          {
            id: tid(),
            type: "separator",
            props: { divider: true, spacing: "small" },
          },
          {
            id: tid(),
            type: "text-display",
            props: { content: "🔔 Benachrichtigungen aktivieren:" },
          },
          {
            id: tid(),
            type: "action-row",
            props: {},
            children: [
              {
                id: tid(),
                type: "button",
                props: { label: "🔔 Updates", style: "primary", custom_id: "notify_updates" },
              },
              {
                id: tid(),
                type: "button",
                props: { label: "📰 News", style: "secondary", custom_id: "notify_news" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "feedback",
    name: "Feedback-Form",
    description: "Feedback per Select Menu und Submit Button",
    icon: MessageSquare,
    components: [
      {
        id: tid(),
        type: "container",
        props: { accent_color: "#5865F2" },
        children: [
          {
            id: tid(),
            type: "text-display",
            props: { content: "**💬 Feedback**\n\nWie gefällt dir der Server?" },
          },
          {
            id: tid(),
            type: "select-menu",
            props: {
              select_type: "string",
              custom_id: "feedback_rating",
              placeholder: "Bewertung wählen...",
              min_values: 1,
              max_values: 1,
              options: [
                { label: "⭐⭐⭐⭐⭐ Super", value: "5", description: "" },
                { label: "⭐⭐⭐⭐ Gut", value: "4", description: "" },
                { label: "⭐⭐⭐ OK", value: "3", description: "" },
                { label: "⭐⭐ Naja", value: "2", description: "" },
                { label: "⭐ Schlecht", value: "1", description: "" },
              ],
            },
          },
          {
            id: tid(),
            type: "action-row",
            props: {},
            children: [
              {
                id: tid(),
                type: "button",
                props: { label: "📨 Feedback senden", style: "success", custom_id: "submit_feedback" },
              },
            ],
          },
        ],
      },
    ],
  },
];

interface TemplateGalleryProps {
  onLoad: (components: BuilderComponent[]) => void;
}

export function TemplateGallery({ onLoad }: TemplateGalleryProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Templates</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {templates.map((tpl) => (
          <Card
            key={tpl.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onLoad(structuredClone(tpl.components))}
          >
            <CardHeader className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <tpl.icon className="size-4 text-primary" />
                <CardTitle className="text-xs">{tpl.name}</CardTitle>
              </div>
              <CardDescription className="text-xs line-clamp-2">
                {tpl.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
