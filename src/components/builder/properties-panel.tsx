"use client";

import type { BuilderComponent, ButtonStyle } from "@/types/builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface PropertiesPanelProps {
  component: BuilderComponent | null;
  onUpdate: (id: string, props: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

export function PropertiesPanel({ component, onUpdate, onDelete }: PropertiesPanelProps) {
  if (!component) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Eigenschaften</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wähle eine Komponente aus, um ihre Eigenschaften zu bearbeiten.
          </p>
        </CardContent>
      </Card>
    );
  }

  const update = (key: string, value: unknown) => {
    onUpdate(component.id, { ...component.props, [key]: value });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium capitalize">
          {component.type.replace("-", " ")}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive"
          onClick={() => onDelete(component.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {component.type === "container" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={(component.props.accent_color as string) || "#5865F2"}
                  onChange={(e) => update("accent_color", e.target.value)}
                  className="w-12 h-9 p-1"
                />
                <Input
                  value={(component.props.accent_color as string) || "#5865F2"}
                  onChange={(e) => update("accent_color", e.target.value)}
                  placeholder="#5865F2"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="spoiler">Spoiler</Label>
              <Switch
                id="spoiler"
                checked={(component.props.spoiler as boolean) || false}
                onCheckedChange={(v) => update("spoiler", v)}
              />
            </div>
          </>
        )}

        {component.type === "text-display" && (
          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea
              id="content"
              value={(component.props.content as string) || ""}
              onChange={(e) => update("content", e.target.value)}
              placeholder="**Fetter Text**, *kursiv*, `code`"
              rows={4}
            />
          </div>
        )}

        {component.type === "button" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={(component.props.label as string) || ""}
                onChange={(e) => update("label", e.target.value)}
                placeholder="Klick mich"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select
                value={(component.props.style as string) || "primary"}
                onValueChange={(v) => update("style", v as ButtonStyle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary (Blau)</SelectItem>
                  <SelectItem value="secondary">Secondary (Grau)</SelectItem>
                  <SelectItem value="success">Success (Grün)</SelectItem>
                  <SelectItem value="danger">Danger (Rot)</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom_id">Custom ID</Label>
              <Input
                id="custom_id"
                value={(component.props.custom_id as string) || ""}
                onChange={(e) => update("custom_id", e.target.value)}
                placeholder="btn_confirm"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                value={(component.props.emoji as string) || ""}
                onChange={(e) => update("emoji", e.target.value)}
                placeholder="✅"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL (nur bei Link-Style)</Label>
              <Input
                id="url"
                value={(component.props.url as string) || ""}
                onChange={(e) => update("url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="disabled">Deaktiviert</Label>
              <Switch
                id="disabled"
                checked={(component.props.disabled as boolean) || false}
                onCheckedChange={(v) => update("disabled", v)}
              />
            </div>
          </>
        )}

        {component.type === "separator" && (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="divider">Linie anzeigen</Label>
              <Switch
                id="divider"
                checked={component.props.divider !== false}
                onCheckedChange={(v) => update("divider", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spacing">Abstand</Label>
              <Select
                value={(component.props.spacing as string) || "small"}
                onValueChange={(v) => update("spacing", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Klein</SelectItem>
                  <SelectItem value="large">Groß</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {component.type === "thumbnail" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">Bild-URL</Label>
              <Input
                id="url"
                value={(component.props.url as string) || ""}
                onChange={(e) => update("url", e.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={(component.props.description as string) || ""}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="spoiler">Spoiler</Label>
              <Switch
                id="spoiler"
                checked={(component.props.spoiler as boolean) || false}
                onCheckedChange={(v) => update("spoiler", v)}
              />
            </div>
          </>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground font-mono">ID: {component.id}</p>
        </div>
      </CardContent>
    </Card>
  );
}
