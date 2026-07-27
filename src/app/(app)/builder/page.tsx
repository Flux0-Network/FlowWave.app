"use client";

import { useCallback, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

// Components V2 Builder
import { ComponentPalette } from "@/components/builder/component-palette";
import { DiscordPreview } from "@/components/builder/discord-preview";
import { PropertiesPanel } from "@/components/builder/properties-panel";
import { SortableCanvas } from "@/components/builder/sortable-canvas";
import { TemplateGallery } from "@/components/builder/template-gallery";
import { ShareDialog } from "@/components/builder/share-dialog";
import { LivePreviewDialog } from "@/components/builder/live-preview-dialog";
import { generateComponentsV2Code } from "@/lib/codegen/components-v2";
import type { BuilderComponent, ComponentType } from "@/types/builder";

// Cog Generator
import { CommandBuilder } from "@/components/generator/command-builder";
import { ModalBuilder } from "@/components/generator/modal-builder";
import { SqliteBuilder } from "@/components/generator/sqlite-builder";
import { EventListenerBuilder } from "@/components/generator/event-listener-builder";
import { AutocompleteBuilder, type AutocompleteConfig } from "@/components/generator/autocomplete-builder";
import { generateCogCode } from "@/lib/codegen/cog-generator";
import type { CogConfig } from "@/types/generator";

// Shared
import { CodeOutput } from "@/components/builder/code-output";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Undo2, Redo2, Trash2, LayoutTemplate, Share2, Send,
  Blocks, Cog, Layers, Eye, Settings2, Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── ID generator ────────────────────────────────────────────────────────────────────────────
let idCounter = 0;
function genId() {
  return `c${++idCounter}-${Date.now().toString(36)}`;
}

function createDefaultProps(type: ComponentType): Record<string, unknown> {
  switch (type) {
    case "container":    return { accent_color: "#5865F2", spoiler: false };
    case "section":      return {};
    case "text-display": return { content: "Hello World!" };
    case "button":       return { label: "Klick mich", style: "primary", custom_id: "btn_" + genId() };
    case "separator":    return { divider: true, spacing: "small" };
    case "thumbnail":    return { url: "" };
    case "media-gallery": return { items: [] };
    case "action-row":   return {};
    case "select-menu":  return {
      select_type: "string",
      custom_id: "select_" + genId(),
      placeholder: "Wähle eine Option...",
      min_values: 1,
      max_values: 1,
      options: [
        { label: "Option 1", value: "opt_1", description: "", emoji: "" },
        { label: "Option 2", value: "opt_2", description: "", emoji: "" },
      ],
    };
    default: return {};
  }
}

const containerTypes = new Set<ComponentType>(["container", "action-row", "section"]);

type Mode = "components" | "cog";
type MobileCompPanel = "palette" | "preview" | "properties";
type MobileCogPanel  = "config" | "code";

// ── Page ────────────────────────────────────────────────────────────────────────────────
export default function BuilderPage({ initialMode = "components", embedded = false }: { initialMode?: Mode; embedded?: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const [mobileCompPanel, setMobileCompPanel] = useState<MobileCompPanel>("palette");
  const [mobileCogPanel,  setMobileCogPanel]  = useState<MobileCogPanel>("config");

  // ── Components V2 state ───────────────────────────────────────────────────────────
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [history,     setHistory]     = useState<BuilderComponent[][]>([[]]);
  const [historyIdx,  setHistoryIdx]  = useState(0);
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [showShare,       setShowShare]       = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const pushHistory = useCallback((next: BuilderComponent[]) => {
    const h = history.slice(0, historyIdx + 1);
    h.push(next);
    setHistory(h);
    setHistoryIdx(h.length - 1);
  }, [history, historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setComponents(history[historyIdx - 1]);
    }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setComponents(history[historyIdx + 1]);
    }
  }, [history, historyIdx]);

  const handleAdd = useCallback((type: ComponentType) => {
    const newComp: BuilderComponent = {
      id: genId(), type,
      props: createDefaultProps(type),
      children: containerTypes.has(type) ? [] : undefined,
    };
    let next: BuilderComponent[];
    if (selectedId) {
      const sel = findComponent(components, selectedId);
      next = sel && containerTypes.has(sel.type)
        ? addChild(components, selectedId, newComp)
        : [...components, newComp];
    } else {
      next = [...components, newComp];
    }
    setComponents(next);
    pushHistory(next);
    setSelectedId(newComp.id);
    setMobileCompPanel("properties");
  }, [components, selectedId, pushHistory]);

  const handleUpdate = useCallback((id: string, props: Record<string, unknown>) => {
    const next = updateComponentProps(components, id, props);
    setComponents(next);
    pushHistory(next);
  }, [components, pushHistory]);

  const handleDelete = useCallback((id: string) => {
    const next = removeComponent(components, id);
    setComponents(next);
    pushHistory(next);
    if (selectedId === id) setSelectedId(null);
  }, [components, selectedId, pushHistory]);

  const handleReorder = useCallback((reordered: BuilderComponent[]) => {
    setComponents(reordered);
    pushHistory(reordered);
  }, [pushHistory]);

  const handleClearAll = useCallback(() => {
    setComponents([]);
    pushHistory([]);
    setSelectedId(null);
  }, [pushHistory]);

  const handleLoadTemplate = useCallback((tpl: BuilderComponent[]) => {
    setComponents(tpl);
    pushHistory(tpl);
    setSelectedId(null);
    setShowTemplates(false);
  }, [pushHistory]);

  const handleMobileSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setMobileCompPanel("properties");
  }, []);

  const selectedComponent = selectedId ? findComponent(components, selectedId) : null;
  const componentsCode = useMemo(() => generateComponentsV2Code(components), [components]);

  // ── Cog Generator state ───────────────────────────────────────────────────────────
  const [cogConfig, setCogConfig] = useState<CogConfig>({
    cogName: "MeinCog",
    commands: [],
    modals: [],
    tables: [],
    listeners: [],
  });
  const [autocompleteConfigs, setAutocompleteConfigs] = useState<AutocompleteConfig[]>([]);
  const cogCode = useMemo(
    () => generateCogCode(cogConfig, autocompleteConfigs),
    [cogConfig, autocompleteConfigs]
  );

  function CogTabs() {
    return (
      <Tabs defaultValue="commands">
        <TabsList className="w-full h-8">
          <TabsTrigger value="commands"     className="flex-1 text-xs">Commands</TabsTrigger>
          <TabsTrigger value="modals"       className="flex-1 text-xs">Modals</TabsTrigger>
          <TabsTrigger value="sqlite"       className="flex-1 text-xs">SQLite</TabsTrigger>
          <TabsTrigger value="events"       className="flex-1 text-xs">Events</TabsTrigger>
          <TabsTrigger value="autocomplete" className="flex-1 text-xs">Auto</TabsTrigger>
        </TabsList>
        <TabsContent value="commands" className="mt-4">
          <CommandBuilder commands={cogConfig.commands} onChange={(commands) => setCogConfig({ ...cogConfig, commands })} />
        </TabsContent>
        <TabsContent value="modals" className="mt-4">
          <ModalBuilder modals={cogConfig.modals} onChange={(modals) => setCogConfig({ ...cogConfig, modals })} />
        </TabsContent>
        <TabsContent value="sqlite" className="mt-4">
          <SqliteBuilder tables={cogConfig.tables} onChange={(tables) => setCogConfig({ ...cogConfig, tables })} />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <EventListenerBuilder listeners={cogConfig.listeners} onChange={(listeners) => setCogConfig({ ...cogConfig, listeners })} />
        </TabsContent>
        <TabsContent value="autocomplete" className="mt-4">
          <AutocompleteBuilder configs={autocompleteConfigs} commands={cogConfig.commands} onChange={setAutocompleteConfigs} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className={embedded ? "flex flex-col h-full" : "flex flex-col h-[calc(100vh-3.25rem)]"}>

      {/* ── Unified toolbar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border/70 bg-card/50 px-2 sm:px-3 py-1.5 shrink-0">

        <div className="flex items-center rounded-md border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setMode("components")}
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-[12px] font-medium transition-colors",
              mode === "components"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Blocks className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Components V2</span>
          </button>
          <div className="w-px bg-border self-stretch" />
          <button
            onClick={() => setMode("cog")}
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-[12px] font-medium transition-colors",
              mode === "cog"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Cog className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Cog Generator</span>
          </button>
        </div>

        <div className="w-px h-4 bg-border shrink-0" />

        {mode === "components" && (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={undo} disabled={historyIdx <= 0}>
              <Undo2 className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={redo} disabled={historyIdx >= history.length - 1}>
              <Redo2 className="size-3.5" />
            </Button>
            <div className="w-px h-4 bg-border mx-0.5 sm:mx-1 shrink-0" />
            <Button
              variant="ghost" size="sm"
              className={cn("h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2", showTemplates && "bg-accent text-foreground")}
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <LayoutTemplate className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2" onClick={() => setShowShare(true)}>
              <Share2 className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Teilen</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2" onClick={() => setShowLivePreview(true)}>
              <Send className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Live Preview</span>
            </Button>
          </div>
        )}

        {mode === "cog" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="cogName" className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
              Cog Name:
            </Label>
            <Input
              id="cogName"
              value={cogConfig.cogName}
              onChange={(e) => setCogConfig({ ...cogConfig, cogName: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
              className="w-28 sm:w-40 font-mono text-xs h-7 bg-background"
            />
          </div>
        )}

        <div className="flex-1" />

        {mode === "components" && (
          <Button
            variant="ghost" size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive px-2 shrink-0"
            onClick={handleClearAll}
          >
            <Trash2 className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Leeren</span>
          </Button>
        )}
      </div>

      {mode === "components" && showTemplates && (
        <div className="border-b border-border/70 px-4 py-3 bg-muted/20 shrink-0">
          <TemplateGallery onLoad={handleLoadTemplate} />
        </div>
      )}

      {/* ── Components V2 ───────────────────────────────────────────────────────── */}
      {mode === "components" && (
        <>
          {/* Desktop */}
          <div className="hidden md:grid flex-1 grid-cols-[256px_1fr_272px] gap-0 overflow-hidden">
            <div className="border-r border-border/70 overflow-y-auto flex flex-col bg-card/30">
              <div className="p-3"><ComponentPalette onAdd={handleAdd} /></div>
              {components.length > 0 && (
                <div className="border-t border-border/70 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Reihenfolge</p>
                  <SortableCanvas components={components} selectedId={selectedId} onSelect={setSelectedId} onReorder={handleReorder} onDelete={handleDelete} />
                </div>
              )}
            </div>
            <div className="overflow-y-auto p-4 bg-background">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <TabsList className="w-fit h-8">
                  <TabsTrigger value="preview" className="text-xs px-3">Discord Preview</TabsTrigger>
                  <TabsTrigger value="code"    className="text-xs px-3">Python Code</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="flex-1 mt-4">
                  <DiscordPreview components={components} selectedId={selectedId} onSelect={setSelectedId} />
                </TabsContent>
                <TabsContent value="code" className="flex-1 mt-4">
                  <CodeOutput code={componentsCode} />
                </TabsContent>
              </Tabs>
            </div>
            <div className="border-l border-border/70 overflow-y-auto bg-card/30">
              <PropertiesPanel component={selectedComponent} onUpdate={handleUpdate} onDelete={handleDelete} />
            </div>
          </div>

          {/* Mobile: one panel at a time */}
          <div className="md:hidden flex-1 overflow-hidden">
            {mobileCompPanel === "palette" && (
              <div className="h-full overflow-y-auto bg-card/30">
                <div className="p-3"><ComponentPalette onAdd={handleAdd} /></div>
                {components.length > 0 && (
                  <div className="border-t border-border/70 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Reihenfolge</p>
                    <SortableCanvas components={components} selectedId={selectedId} onSelect={handleMobileSelect} onReorder={handleReorder} onDelete={handleDelete} />
                  </div>
                )}
              </div>
            )}
            {mobileCompPanel === "preview" && (
              <div className="h-full overflow-y-auto p-4 bg-background">
                <Tabs defaultValue="preview" className="flex flex-col h-full">
                  <TabsList className="w-fit h-8">
                    <TabsTrigger value="preview" className="text-xs px-3">Discord Preview</TabsTrigger>
                    <TabsTrigger value="code"    className="text-xs px-3">Python Code</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="flex-1 mt-4">
                    <DiscordPreview components={components} selectedId={selectedId} onSelect={handleMobileSelect} />
                  </TabsContent>
                  <TabsContent value="code" className="flex-1 mt-4">
                    <CodeOutput code={componentsCode} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
            {mobileCompPanel === "properties" && (
              <div className="h-full overflow-y-auto bg-card/30">
                <PropertiesPanel component={selectedComponent} onUpdate={handleUpdate} onDelete={handleDelete} />
              </div>
            )}
          </div>

          <MobileBottomNav
            items={[
              { key: "palette",    icon: Layers,    label: "Palette" },
              { key: "preview",    icon: Eye,       label: "Preview" },
              { key: "properties", icon: Settings2, label: "Eigenschaften" },
            ]}
            active={mobileCompPanel}
            onChange={(k) => setMobileCompPanel(k as MobileCompPanel)}
          />
        </>
      )}

      {/* ── Cog Generator ──────────────────────────────────────────────────────────── */}
      {mode === "cog" && (
        <>
          {/* Desktop */}
          <div className="hidden md:grid flex-1 grid-cols-[1fr_1fr] gap-0 overflow-hidden">
            <ScrollArea className="border-r border-border/70 bg-card/30">
              <div className="p-4"><CogTabs /></div>
            </ScrollArea>
            <div className="overflow-y-auto p-4 bg-background">
              <CodeOutput code={cogCode} />
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex-1 overflow-hidden">
            {mobileCogPanel === "config" && (
              <div className="h-full overflow-y-auto bg-card/30">
                <div className="p-4"><CogTabs /></div>
              </div>
            )}
            {mobileCogPanel === "code" && (
              <div className="h-full overflow-y-auto p-4 bg-background">
                <CodeOutput code={cogCode} />
              </div>
            )}
          </div>

          <MobileBottomNav
            items={[
              { key: "config", icon: Settings2, label: "Config" },
              { key: "code",   icon: Code2,     label: "Code" },
            ]}
            active={mobileCogPanel}
            onChange={(k) => setMobileCogPanel(k as MobileCogPanel)}
          />
        </>
      )}

      <ShareDialog open={showShare} onOpenChange={setShowShare} components={components} />
      <LivePreviewDialog open={showLivePreview} onOpenChange={setShowLivePreview} components={components} />
    </div>
  );
}

// ── Mobile bottom nav ────────────────────────────────────────────────────────────────────
function MobileBottomNav({
  items, active, onChange,
}: {
  items: { key: string; icon: LucideIcon; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="md:hidden flex items-center border-t border-border/70 bg-card/90 shrink-0 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
            active === key ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="size-[18px]" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Tree helpers ────────────────────────────────────────────────────────────────────────────
function findComponent(components: BuilderComponent[], id: string): BuilderComponent | null {
  for (const c of components) {
    if (c.id === id) return c;
    if (c.children) {
      const found = findComponent(c.children, id);
      if (found) return found;
    }
  }
  return null;
}

function addChild(components: BuilderComponent[], parentId: string, child: BuilderComponent): BuilderComponent[] {
  return components.map((c) => {
    if (c.id === parentId) return { ...c, children: [...(c.children || []), child] };
    if (c.children) return { ...c, children: addChild(c.children, parentId, child) };
    return c;
  });
}

function updateComponentProps(components: BuilderComponent[], id: string, props: Record<string, unknown>): BuilderComponent[] {
  return components.map((c) => {
    if (c.id === id) return { ...c, props };
    if (c.children) return { ...c, children: updateComponentProps(c.children, id, props) };
    return c;
  });
}

function removeComponent(components: BuilderComponent[], id: string): BuilderComponent[] {
  return components
    .filter((c) => c.id !== id)
    .map((c) => {
      if (c.children) return { ...c, children: removeComponent(c.children, id) };
      return c;
    });
}
