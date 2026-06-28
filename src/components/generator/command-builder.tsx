"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { SlashCommand, CommandOption, OptionType } from "@/types/generator";

interface CommandBuilderProps {
  commands: SlashCommand[];
  onChange: (commands: SlashCommand[]) => void;
}

let optCounter = 0;
function genOptId() {
  optCounter++;
  return `opt_${optCounter}_${Date.now().toString(36)}`;
}

let cmdCounter = 0;
function genCmdId() {
  cmdCounter++;
  return `cmd_${cmdCounter}_${Date.now().toString(36)}`;
}

export function CommandBuilder({ commands, onChange }: CommandBuilderProps) {
  const [expandedCmd, setExpandedCmd] = useState<string | null>(null);

  const addCommand = () => {
    const cmd: SlashCommand = {
      id: genCmdId(),
      name: "neuer_command",
      description: "Beschreibung",
      options: [],
      hasModal: false,
      hasSqlite: false,
      responseType: "message",
    };
    onChange([...commands, cmd]);
    setExpandedCmd(cmd.id);
  };

  const updateCommand = (id: string, updates: Partial<SlashCommand>) => {
    onChange(commands.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCommand = (id: string) => {
    onChange(commands.filter((c) => c.id !== id));
    if (expandedCmd === id) setExpandedCmd(null);
  };

  const addOption = (cmdId: string) => {
    const cmd = commands.find((c) => c.id === cmdId);
    if (!cmd) return;
    const opt: CommandOption = {
      id: genOptId(),
      name: "option",
      description: "Beschreibung",
      type: "string",
      required: false,
    };
    updateCommand(cmdId, { options: [...cmd.options, opt] });
  };

  const updateOption = (cmdId: string, optId: string, updates: Partial<CommandOption>) => {
    const cmd = commands.find((c) => c.id === cmdId);
    if (!cmd) return;
    const newOpts = cmd.options.map((o) => (o.id === optId ? { ...o, ...updates } : o));
    updateCommand(cmdId, { options: newOpts });
  };

  const removeOption = (cmdId: string, optId: string) => {
    const cmd = commands.find((c) => c.id === cmdId);
    if (!cmd) return;
    updateCommand(cmdId, { options: cmd.options.filter((o) => o.id !== optId) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Slash Commands</h3>
        <Button size="sm" onClick={addCommand}>
          <Plus className="size-4 mr-1" />
          Command
        </Button>
      </div>

      {commands.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Noch keine Commands. Klicke &quot;+ Command&quot; um loszulegen.
        </p>
      )}

      {commands.map((cmd) => (
        <Card key={cmd.id}>
          <CardHeader
            className="cursor-pointer pb-3"
            onClick={() => setExpandedCmd(expandedCmd === cmd.id ? null : cmd.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-mono">/{cmd.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {cmd.options.length} Optionen
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCommand(cmd.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </CardHeader>

          {expandedCmd === cmd.id && (
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={cmd.name}
                    onChange={(e) =>
                      updateCommand(cmd.id, {
                        name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                      })
                    }
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Beschreibung</Label>
                  <Input
                    value={cmd.description}
                    onChange={(e) =>
                      updateCommand(cmd.id, { description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cmd.hasModal}
                    onCheckedChange={(v) => updateCommand(cmd.id, { hasModal: v })}
                  />
                  <Label className="text-xs">Modal öffnen</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cmd.hasSqlite}
                    onCheckedChange={(v) => updateCommand(cmd.id, { hasSqlite: v })}
                  />
                  <Label className="text-xs">SQLite nutzen</Label>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Optionen</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addOption(cmd.id)}>
                    <Plus className="size-3 mr-1" />
                    Option
                  </Button>
                </div>

                {cmd.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2 rounded border p-2">
                    <Input
                      value={opt.name}
                      onChange={(e) =>
                        updateOption(cmd.id, opt.id, {
                          name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                        })
                      }
                      placeholder="name"
                      className="font-mono text-xs h-8"
                    />
                    <Select
                      value={opt.type}
                      onValueChange={(v) =>
                        updateOption(cmd.id, opt.id, { type: v as OptionType })
                      }
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="integer">Integer</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="channel">Channel</SelectItem>
                        <SelectItem value="role">Role</SelectItem>
                        <SelectItem value="attachment">Attachment</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={opt.required}
                        onCheckedChange={(v) =>
                          updateOption(cmd.id, opt.id, { required: v })
                        }
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Req.</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive"
                      onClick={() => removeOption(cmd.id, opt.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
