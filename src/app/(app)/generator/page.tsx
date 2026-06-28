"use client";

import { useMemo, useState } from "react";
import { CommandBuilder } from "@/components/generator/command-builder";
import { ModalBuilder } from "@/components/generator/modal-builder";
import { SqliteBuilder } from "@/components/generator/sqlite-builder";
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

  const code = useMemo(() => generateCogCode(config), [config]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-4 border-b px-4 py-2">
        <h1 className="text-lg font-semibold">Cog Generator</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="cogName" className="text-sm whitespace-nowrap">
            Cog Name:
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
            className="w-48 font-mono text-sm h-8"
          />
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-[1fr_1fr] gap-0 overflow-hidden">
        {/* Left: Config */}
        <ScrollArea className="border-r">
          <div className="p-4">
            <Tabs defaultValue="commands">
              <TabsList className="w-full">
                <TabsTrigger value="commands" className="flex-1">
                  Commands
                </TabsTrigger>
                <TabsTrigger value="modals" className="flex-1">
                  Modals
                </TabsTrigger>
                <TabsTrigger value="sqlite" className="flex-1">
                  SQLite
                </TabsTrigger>
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
            </Tabs>
          </div>
        </ScrollArea>

        {/* Right: Code output */}
        <div className="overflow-y-auto p-4">
          <CodeOutput code={code} />
        </div>
      </div>
    </div>
  );
}
