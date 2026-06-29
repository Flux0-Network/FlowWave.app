"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";
import { cn } from "@/lib/utils";

interface SortableCanvasProps {
  components: BuilderComponent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (components: BuilderComponent[]) => void;
  onDelete: (id: string) => void;
}

export function SortableCanvas({
  components,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
}: SortableCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);
      onReorder(arrayMove(components, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={components.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {components.map((comp) => (
            <SortableItem
              key={comp.id}
              component={comp}
              isSelected={comp.id === selectedId}
              onSelect={() => onSelect(comp.id)}
              onDelete={() => onDelete(comp.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  component,
  isSelected,
  onSelect,
  onDelete,
}: {
  component: BuilderComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeLabels: Record<string, string> = {
    container: "Container",
    section: "Section",
    "text-display": "Text Display",
    button: "Button",
    separator: "Separator",
    thumbnail: "Thumbnail",
    "media-gallery": "Media Gallery",
    "action-row": "Action Row",
    "select-menu": "Select Menu",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent",
        isDragging && "opacity-50"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex-1 truncate">
        {typeLabels[component.type] || component.type}
        {typeof component.props.label === "string" && component.props.label && (
          <span className="text-muted-foreground ml-1">
            — {component.props.label}
          </span>
        )}
        {typeof component.props.content === "string" && component.props.content && (
          <span className="text-muted-foreground ml-1">
            — {component.props.content.slice(0, 30)}
          </span>
        )}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
