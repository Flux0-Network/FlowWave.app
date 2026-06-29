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
import { Plus, Trash2, Search } from "lucide-react";
import type { SlashCommand } from "@/types/generator";

export interface AutocompleteConfig {
  id: string;
  commandId: string;
  optionName: string;
  source: "static" | "database" | "api";
  staticChoices?: { name: string; value: string }[];
  dbTable?: string;
  dbColumn?: string;
}

interface AutocompleteBuilderProps {
  configs: AutocompleteConfig[];
  commands: SlashCommand[];
  onChange: (configs: AutocompleteConfig[]) => void;
}

let acCounter = 0;
function genAcId() {
  acCounter++;
  return `ac_${acCounter}_${Date.now().toString(36)}`;
}

export function AutocompleteBuilder({
  configs,
  commands,
  onChange,
}: AutocompleteBuilderProps) {
  const allOptions = commands.flatMap((cmd) =>
    cmd.options
      .filter((opt) => opt.type === "string")
      .map((opt) => ({
        commandId: cmd.id,
        commandName: cmd.name,
        optionName: opt.name,
      }))
  );

  const addConfig = () => {
    if (allOptions.length === 0) return;
    const first = allOptions[0];
    const config: AutocompleteConfig = {
      id: genAcId(),
      commandId: first.commandId,
      optionName: first.optionName,
      source: "static",
      staticChoices: [
        { name: "Beispiel 1", value: "example_1" },
        { name: "Beispiel 2", value: "example_2" },
      ],
    };
    onChange([...configs, config]);
  };

  const updateConfig = (id: string, updates: Partial<AutocompleteConfig>) => {
    onChange(configs.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeConfig = (id: string) => {
    onChange(configs.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Search className="size-4" />
          Autocomplete
        </h3>
        <Button size="sm" onClick={addConfig} disabled={allOptions.length === 0}>
          <Plus className="size-4 mr-1" />
          Autocomplete
        </Button>
      </div>

      {allOptions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Erstelle zuerst einen Command mit String-Optionen.
        </p>
      )}

      {configs.length === 0 && allOptions.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Noch keine Autocomplete-Handler. Klicke &quot;+ Autocomplete&quot; um dynamische
          Vorschläge für Command-Optionen einzurichten.
        </p>
      )}

      {configs.map((config) => {
        const cmd = commands.find((c) => c.id === config.commandId);
        return (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="size-4 text-blue-400" />
                  <CardTitle className="text-sm font-mono">
                    /{cmd?.name ?? "?"}.{config.optionName}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {config.source}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  onClick={() => removeConfig(config.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Command & Option</Label>
                  <Select
                    value={`${config.commandId}::${config.optionName}`}
                    onValueChange={(v) => {
                      if (!v) return;
                      const [commandId, optionName] = v.split("::");
                      updateConfig(config.id, { commandId, optionName });
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allOptions.map((opt) => (
                        <SelectItem
                          key={`${opt.commandId}::${opt.optionName}`}
                          value={`${opt.commandId}::${opt.optionName}`}
                        >
                          <span className="font-mono">
                            /{opt.commandName}.{opt.optionName}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quelle</Label>
                  <Select
                    value={config.source}
                    onValueChange={(v) =>
                      updateConfig(config.id, {
                        source: v as AutocompleteConfig["source"],
                      })
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Statische Choices</SelectItem>
                      <SelectItem value="database">Aus Datenbank</SelectItem>
                      <SelectItem value="api">Externer API-Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {config.source === "static" && (
                <div className="space-y-2">
                  <Label className="text-xs">Choices</Label>
                  {(config.staticChoices || []).map((choice, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={choice.name}
                        onChange={(e) => {
                          const choices = [...(config.staticChoices || [])];
                          choices[idx] = { ...choices[idx], name: e.target.value };
                          updateConfig(config.id, { staticChoices: choices });
                        }}
                        placeholder="Name"
                        className="text-xs h-7"
                      />
                      <Input
                        value={choice.value}
                        onChange={(e) => {
                          const choices = [...(config.staticChoices || [])];
                          choices[idx] = { ...choices[idx], value: e.target.value };
                          updateConfig(config.id, { staticChoices: choices });
                        }}
                        placeholder="value"
                        className="font-mono text-xs h-7"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-destructive"
                        onClick={() => {
                          const choices = (config.staticChoices || []).filter(
                            (_, i) => i !== idx
                          );
                          updateConfig(config.id, { staticChoices: choices });
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => {
                      const choices = [
                        ...(config.staticChoices || []),
                        { name: "Neu", value: `choice_${Date.now()}` },
                      ];
                      updateConfig(config.id, { staticChoices: choices });
                    }}
                    disabled={(config.staticChoices || []).length >= 25}
                  >
                    + Choice (max 25)
                  </Button>
                </div>
              )}

              {config.source === "database" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tabelle</Label>
                    <Input
                      value={config.dbTable || ""}
                      onChange={(e) =>
                        updateConfig(config.id, { dbTable: e.target.value })
                      }
                      placeholder="tabelle"
                      className="font-mono text-xs h-7"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Spalte</Label>
                    <Input
                      value={config.dbColumn || ""}
                      onChange={(e) =>
                        updateConfig(config.id, { dbColumn: e.target.value })
                      }
                      placeholder="name"
                      className="font-mono text-xs h-7"
                    />
                  </div>
                </div>
              )}

              {config.source === "api" && (
                <p className="text-xs text-muted-foreground">
                  API-Autocomplete wird als Platzhalter generiert — füge deine API-Logik
                  manuell in den generierten Code ein.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
