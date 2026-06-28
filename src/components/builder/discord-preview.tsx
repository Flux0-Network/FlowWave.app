"use client";

import type { BuilderComponent } from "@/types/builder";
import { cn } from "@/lib/utils";

interface DiscordPreviewProps {
  components: BuilderComponent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DiscordPreview({ components, selectedId, onSelect }: DiscordPreviewProps) {
  return (
    <div className="rounded-lg border bg-[#313338] p-4 min-h-[400px]">
      <div className="flex gap-3">
        {/* Bot avatar */}
        <div className="size-10 rounded-full bg-[#5865F2] shrink-0 flex items-center justify-center text-white text-xs font-bold">
          BOT
        </div>
        <div className="min-w-0 flex-1">
          {/* Bot name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">CogsForge Bot</span>
            <span className="rounded bg-[#5865F2] px-1 py-0.5 text-[10px] font-medium text-white">
              BOT
            </span>
          </div>
          {/* Components */}
          <div className="space-y-2">
            {components.length === 0 ? (
              <p className="text-sm text-[#949BA4] italic">
                Füge Komponenten aus der Palette hinzu...
              </p>
            ) : (
              components.map((comp) => (
                <DiscordComponent
                  key={comp.id}
                  component={comp}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscordComponent({
  component,
  selectedId,
  onSelect,
  depth = 0,
}: {
  component: BuilderComponent;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const isSelected = component.id === selectedId;

  switch (component.type) {
    case "container":
      return (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "rounded-lg border-l-4 bg-[#2B2D31] p-3 cursor-pointer transition-all",
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:ring-1 hover:ring-[#5865F2]/50",
          )}
          style={{
            borderLeftColor: (component.props.accent_color as string) || "#5865F2",
          }}
        >
          {component.children?.map((child) => (
            <DiscordComponent
              key={child.id}
              component={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
          {(!component.children || component.children.length === 0) && (
            <p className="text-xs text-[#949BA4] italic p-2">Leerer Container</p>
          )}
        </div>
      );

    case "section":
      return (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "flex items-start gap-3 p-2 rounded cursor-pointer",
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:ring-1 hover:ring-[#5865F2]/50",
          )}
        >
          <div className="flex-1 space-y-1">
            {component.children?.map((child) => (
              <DiscordComponent
                key={child.id}
                component={child}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
            {(!component.children || component.children.length === 0) && (
              <p className="text-xs text-[#949BA4] italic">Leere Section</p>
            )}
          </div>
        </div>
      );

    case "text-display":
      return (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "text-sm text-[#DBDEE1] p-1 rounded cursor-pointer whitespace-pre-wrap",
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:ring-1 hover:ring-[#5865F2]/50",
          )}
        >
          {(component.props.content as string) || "Text..."}
        </div>
      );

    case "button": {
      const styleColors: Record<string, string> = {
        primary: "bg-[#5865F2] text-white",
        secondary: "bg-[#4E5058] text-white",
        success: "bg-[#248046] text-white",
        danger: "bg-[#DA373C] text-white",
        link: "bg-[#4E5058] text-white",
      };
      const style = (component.props.style as string) || "primary";
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-all",
            styleColors[style],
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:brightness-110",
          )}
        >
          {(component.props.emoji as string) && (
            <span>{component.props.emoji as string}</span>
          )}
          {(component.props.label as string) || "Button"}
        </button>
      );
    }

    case "separator":
      return (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "py-1 cursor-pointer rounded",
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:ring-1 hover:ring-[#5865F2]/50",
          )}
        >
          {component.props.divider !== false && (
            <div className="border-t border-[#3F4147]" />
          )}
        </div>
      );

    case "thumbnail":
      return (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "rounded cursor-pointer",
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:ring-1 hover:ring-[#5865F2]/50",
          )}
        >
          <div className="size-16 rounded bg-[#3F4147] flex items-center justify-center text-[#949BA4] text-xs">
            IMG
          </div>
        </div>
      );

    case "media-gallery":
      return (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "grid grid-cols-2 gap-1 rounded cursor-pointer",
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:ring-1 hover:ring-[#5865F2]/50",
          )}
        >
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded bg-[#3F4147] flex items-center justify-center text-[#949BA4] text-xs"
            >
              Media {i}
            </div>
          ))}
        </div>
      );

    case "action-row":
      return (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
          className={cn(
            "flex flex-wrap gap-2 p-1 rounded cursor-pointer",
            isSelected ? "ring-2 ring-[#5865F2]" : "hover:ring-1 hover:ring-[#5865F2]/50",
          )}
        >
          {component.children?.map((child) => (
            <DiscordComponent
              key={child.id}
              component={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
          {(!component.children || component.children.length === 0) && (
            <p className="text-xs text-[#949BA4] italic">Leere Action Row</p>
          )}
        </div>
      );

    default:
      return null;
  }
}
