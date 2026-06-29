"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Zap } from "lucide-react";
import type { EventListener } from "@/types/generator";

interface EventListenerBuilderProps {
  listeners: EventListener[];
  onChange: (listeners: EventListener[]) => void;
}

const discordEvents = [
  { value: "on_message", label: "on_message", description: "Nachricht gesendet" },
  { value: "on_member_join", label: "on_member_join", description: "Mitglied beigetreten" },
  { value: "on_member_remove", label: "on_member_remove", description: "Mitglied verlassen" },
  { value: "on_reaction_add", label: "on_reaction_add", description: "Reaktion hinzugefügt" },
  { value: "on_reaction_remove", label: "on_reaction_remove", description: "Reaktion entfernt" },
  { value: "on_voice_state_update", label: "on_voice_state_update", description: "Voice-State geändert" },
  { value: "on_interaction", label: "on_interaction", description: "Interaction empfangen" },
  { value: "on_message_delete", label: "on_message_delete", description: "Nachricht gelöscht" },
  { value: "on_message_edit", label: "on_message_edit", description: "Nachricht bearbeitet" },
  { value: "on_guild_channel_create", label: "on_guild_channel_create", description: "Channel erstellt" },
  { value: "on_guild_channel_delete", label: "on_guild_channel_delete", description: "Channel gelöscht" },
  { value: "on_guild_role_create", label: "on_guild_role_create", description: "Rolle erstellt" },
  { value: "on_guild_role_delete", label: "on_guild_role_delete", description: "Rolle gelöscht" },
  { value: "on_invite_create", label: "on_invite_create", description: "Einladung erstellt" },
  { value: "on_thread_create", label: "on_thread_create", description: "Thread erstellt" },
];

let listenerCounter = 0;
function genListenerId() {
  listenerCounter++;
  return `listener_${listenerCounter}_${Date.now().toString(36)}`;
}

export function EventListenerBuilder({
  listeners,
  onChange,
}: EventListenerBuilderProps) {
  const addListener = () => {
    const listener: EventListener = {
      id: genListenerId(),
      event: "on_message",
    };
    onChange([...listeners, listener]);
  };

  const updateListener = (id: string, updates: Partial<EventListener>) => {
    onChange(listeners.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const removeListener = (id: string) => {
    onChange(listeners.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="size-4" />
          Event Listeners
        </h3>
        <Button size="sm" onClick={addListener}>
          <Plus className="size-4 mr-1" />
          Listener
        </Button>
      </div>

      {listeners.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Noch keine Event Listeners. Klicke &quot;+ Listener&quot; um auf
          Discord-Events zu reagieren.
        </p>
      )}

      {listeners.map((listener) => (
        <Card key={listener.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-yellow-500" />
                <CardTitle className="text-sm font-mono">{listener.event}</CardTitle>
                {listener.customIdPattern && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {listener.customIdPattern}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive"
                onClick={() => removeListener(listener.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-1.5">
              <Label className="text-xs">Event</Label>
              <Select
                value={listener.event}
                onValueChange={(v) => { if (v) updateListener(listener.id, { event: v }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {discordEvents.map((evt) => (
                    <SelectItem key={evt.value} value={evt.value}>
                      <span className="font-mono text-xs">{evt.label}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        — {evt.description}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {listener.event === "on_interaction" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Custom ID Pattern (optional)</Label>
                <Input
                  value={listener.customIdPattern || ""}
                  onChange={(e) =>
                    updateListener(listener.id, {
                      customIdPattern: e.target.value,
                    })
                  }
                  placeholder='z.B. "btn_confirm" oder "ticket_*"'
                  className="font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
