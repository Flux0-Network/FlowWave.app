"use client";

import { useMemo, useState } from "react";
import { CommandBuilder } from "@/components/generator/command-builder";
import { ModalBuilder } from "@/components/generator/modal-builder";
import { SqliteBuilder } from "@/components/generator/sqlite-builder";
import { EventListenerBuilder } from "@/components/generator/event-listener-builder";
import { AutocompleteBuilder, type AutocompleteConfig } from "@/components/generator/autocomplete-builder";
import { CodeOutput } from "@/components/builder/code-output";
import { generateCogCode } from "@/lib/codegen/cog-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CogConfig } from "@/types/generator";

export default function GeneratorPage() {
  const [config, setConfig] = useState<CogConfig>({
    cogName: "MeinCog",
    commands: [],
    modals: [],
    tables: [],
    listeners: [],
  });
  const [autocompleteConfigs, setAutocompleteConfigs] = useState<AutocompleteConfig[]>([]);

  const code = useMemo(
    () => generateCogCode(config, autocompleteConfigs),
    [config, autocompleteConfigs]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border/70 bg-card/50 px-4 py-1.5 shrink-0">
        <span className="text-sm font-semibold">Cog Generator</span>
        <div className="flex items-center gap-2 ml-2">
          <Label htmlFor="cogName" className="text-xs text-muted-foreground whitespace-nowrap">
            Name:
          </Label>
          <Input
            id="cogName"
            value={config.cogName}
            onChange={(e) =>
              setConfig({
                ...config,
                cogName: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
              })
            }
            className="w-44 font-mono text-xs h-7 bg-background"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_1fr] gap-0 overflow-hidden">
        <ScrollArea className="border-r border-border/70 bg-card/30">
          <div className="p-4">
            <Tabs defaultValue="commands">
              <TabsList className="w-full h-8">
                <TabsTrigger value="commands" className="flex-1 text-xs">Commands</TabsTrigger>
                <TabsTrigger value="modals" className="flex-1 text-xs">Modals</TabsTrigger>
                <TabsTrigger value="sqlite" className="flex-1 text-xs">SQLite</TabsTrigger>
                <TabsTrigger value="events" className="flex-1 text-xs">Events</TabsTrigger>
                <TabsTrigger value="autocomplete" className="flex-1 text-xs">Auto</TabsTrigger>
              </TabsList>
              <TabsContent value="commands" className="mt-4">
                <CommandBuilder
                  commands={config.commands}
                  onChange={(commands) => setConfig({ ...config, commands })}
                />
              </TabsContent>
              <TabsContent value="modals" className="mt-4">
                <ModalBuilder
                  modals={config.modals}
                  onChange={(modals) => setConfig({ ...config, modals })}
                />
              </TabsContent>
              <TabsContent value="sqlite" className="mt-4">
                <SqliteBuilder
                  tables={config.tables}
                  onChange={(tables) => setConfig({ ...config, tables })}
                />
              </TabsContent>
              <TabsContent value="events" className="mt-4">
                <EventListenerBuilder
                  listeners={config.listeners}
                  onChange={(listeners) => setConfig({ ...config, listeners })}
                />
              </TabsContent>
              <TabsContent value="autocomplete" className="mt-4">
                <AutocompleteBuilder
                  configs={autocompleteConfigs}
                  commands={config.commands}
                  onChange={setAutocompleteConfigs}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="overflow-y-auto p-4 bg-background">
          <CodeOutput code={code} />
        </div>
      </div>
    </div>
  );
}
