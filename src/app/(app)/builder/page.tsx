"use client";

import { useCallback, useMemo, useState } from "react";
import { ComponentPalette } from "@/components/builder/component-palette";
import { DiscordPreview } from "@/components/builder/discord-preview";
import { PropertiesPanel } from "@/components/builder/properties-panel";
import { SortableCanvas } from "@/components/builder/sortable-canvas";
import { CodeOutput } from "@/components/builder/code-output";
import { TemplateGallery } from "@/components/builder/template-gallery";
import { ShareDialog } from "@/components/builder/share-dialog";
import { LivePreviewDialog } from "@/components/builder/live-preview-dialog";
import { generateComponentsV2Code } from "@/lib/codegen/components-v2";
import type { BuilderComponent, ComponentType } from "@/types/builder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Trash2, LayoutTemplate, Share2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

let idCounter = 0;
function genId(): string {
  idCounter++;
  return `c${idCounter}-${Date.now().toString(36)}`;
}

function createDefaultProps(type: ComponentType): Record<string, unknown> {
  switch (type) {
    case "container":
      return { accent_color: "#5865F2", spoiler: false };
    case "section":
      return {};
    case "text-display":
      return { content: "Hello World!" };
    case "button":
      return { label: "Klick mich", style: "primary", custom_id: "btn_" + genId() };
    case "separator":
      return { divider: true, spacing: "small" };
    case "thumbnail":
      return { url: "" };
    case "media-gallery":
      return { items: [] };
    case "action-row":
      return {};
    case "select-menu":
      return {
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
    default:
      return {};
  }
}

const containerTypes = new Set<ComponentType>(["container", "action-row", "section"]);

export default function BuilderPage() {
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<BuilderComponent[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const pushHistory = useCallback(
    (next: BuilderComponent[]) => {
      const newHistory = history.slice(0, historyIdx + 1);
      newHistory.push(next);
      setHistory(newHistory);
      setHistoryIdx(newHistory.length - 1);
    },
    [history, historyIdx]
  );

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

  const handleAdd = useCallback(
    (type: ComponentType) => {
      const newComp: BuilderComponent = {
        id: genId(),
        type,
        props: createDefaultProps(type),
        children: containerTypes.has(type) ? [] : undefined,
      };

      let next: BuilderComponent[];

      if (selectedId) {
        const selected = findComponent(components, selectedId);
        if (selected && containerTypes.has(selected.type)) {
          next = addChild(components, selectedId, newComp);
        } else {
          next = [...components, newComp];
        }
      } else {
        next = [...components, newComp];
      }

      setComponents(next);
      pushHistory(next);
      setSelectedId(newComp.id);
    },
    [components, selectedId, pushHistory]
  );

  const handleUpdate = useCallback(
    (id: string, props: Record<string, unknown>) => {
      const next = updateComponentProps(components, id, props);
      setComponents(next);
      pushHistory(next);
    },
    [components, pushHistory]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const next = removeComponent(components, id);
      setComponents(next);
      pushHistory(next);
      if (selectedId === id) setSelectedId(null);
    },
    [components, selectedId, pushHistory]
  );

  const handleReorder = useCallback(
    (reordered: BuilderComponent[]) => {
      setComponents(reordered);
      pushHistory(reordered);
    },
    [pushHistory]
  );

  const handleClearAll = useCallback(() => {
    setComponents([]);
    pushHistory([]);
    setSelectedId(null);
  }, [pushHistory]);

  const handleLoadTemplate = useCallback(
    (templateComponents: BuilderComponent[]) => {
      setComponents(templateComponents);
      pushHistory(templateComponents);
      setSelectedId(null);
      setShowTemplates(false);
    },
    [pushHistory]
  );

  const selectedComponent = selectedId ? findComponent(components, selectedId) : null;
  const code = useMemo(() => generateComponentsV2Code(components), [components]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border/70 bg-card/50 px-3 py-1.5 shrink-0">
        <span className="text-sm font-semibold text-foreground px-1 mr-2">Components V2</span>

        {/* History group */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={undo} disabled={historyIdx <= 0}>
            <Undo2 className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={redo} disabled={historyIdx >= history.length - 1}>
            <Redo2 className="size-3.5" />
          </Button>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Actions group */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground", showTemplates && "bg-accent text-accent-foreground")}
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <LayoutTemplate className="size-3.5" />
            Templates
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowShare(true)}>
            <Share2 className="size-3.5" />
            Teilen
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowLivePreview(true)}>
            <Send className="size-3.5" />
            Live Preview
          </Button>
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          onClick={handleClearAll}
        >
          <Trash2 className="size-3.5" />
          Leeren
        </Button>
      </div>

      {showTemplates && (
        <div className="border-b border-border/70 px-4 py-3 bg-muted/20">
          <TemplateGallery onLoad={handleLoadTemplate} />
        </div>
      )}

      <div className="flex-1 grid grid-cols-[256px_1fr_272px] gap-0 overflow-hidden">
        {/* Left: palette + canvas */}
        <div className="border-r border-border/70 overflow-y-auto flex flex-col gap-0 bg-card/30">
          <div className="p-3">
            <ComponentPalette onAdd={handleAdd} />
          </div>
          {components.length > 0 && (
            <div className="border-t border-border/70 p-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Reihenfolge
              </p>
              <SortableCanvas
                components={components}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onReorder={handleReorder}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        {/* Center: preview + code */}
        <div className="overflow-y-auto p-4 bg-background">
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <TabsList className="w-fit h-8">
              <TabsTrigger value="preview" className="text-xs px-3">Discord Preview</TabsTrigger>
              <TabsTrigger value="code" className="text-xs px-3">Python Code</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 mt-4">
              <DiscordPreview
                components={components}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </TabsContent>
            <TabsContent value="code" className="flex-1 mt-4">
              <CodeOutput code={code} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: properties */}
        <div className="border-l border-border/70 overflow-y-auto bg-card/30">
          <PropertiesPanel
            component={selectedComponent}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <ShareDialog open={showShare} onOpenChange={setShowShare} components={components} />
      <LivePreviewDialog open={showLivePreview} onOpenChange={setShowLivePreview} components={components} />
    </div>
  );
}

function findComponent(
  components: BuilderComponent[],
  id: string
): BuilderComponent | null {
  for (const c of components) {
    if (c.id === id) return c;
    if (c.children) {
      const found = findComponent(c.children, id);
      if (found) return found;
    }
  }
  return null;
}

function addChild(
  components: BuilderComponent[],
  parentId: string,
  child: BuilderComponent
): BuilderComponent[] {
  return components.map((c) => {
    if (c.id === parentId) {
      return { ...c, children: [...(c.children || []), child] };
    }
    if (c.children) {
      return { ...c, children: addChild(c.children, parentId, child) };
    }
    return c;
  });
}

function updateComponentProps(
  components: BuilderComponent[],
  id: string,
  props: Record<string, unknown>
): BuilderComponent[] {
  return components.map((c) => {
    if (c.id === id) return { ...c, props };
    if (c.children) {
      return { ...c, children: updateComponentProps(c.children, id, props) };
    }
    return c;
  });
}

function removeComponent(
  components: BuilderComponent[],
  id: string
): BuilderComponent[] {
  return components
    .filter((c) => c.id !== id)
    .map((c) => {
      if (c.children) {
        return { ...c, children: removeComponent(c.children, id) };
      }
      return c;
    });
}
