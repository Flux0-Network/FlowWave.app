"use client";

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
import { Plus, Trash2 } from "lucide-react";
import type { Modal, ModalField } from "@/types/generator";

interface ModalBuilderProps {
  modals: Modal[];
  onChange: (modals: Modal[]) => void;
}

let fieldCounter = 0;
function genFieldId() {
  fieldCounter++;
  return `field_${fieldCounter}_${Date.now().toString(36)}`;
}

let modalCounter = 0;
function genModalId() {
  modalCounter++;
  return `modal_${modalCounter}_${Date.now().toString(36)}`;
}

export function ModalBuilder({ modals, onChange }: ModalBuilderProps) {
  const addModal = () => {
    const modal: Modal = {
      id: genModalId(),
      title: "Neues Modal",
      custom_id: "modal_" + Date.now().toString(36),
      fields: [],
    };
    onChange([...modals, modal]);
  };

  const updateModal = (id: string, updates: Partial<Modal>) => {
    onChange(modals.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeModal = (id: string) => {
    onChange(modals.filter((m) => m.id !== id));
  };

  const addField = (modalId: string) => {
    const modal = modals.find((m) => m.id === modalId);
    if (!modal) return;
    const field: ModalField = {
      id: genFieldId(),
      label: "Neues Feld",
      placeholder: "",
      style: "short",
      required: true,
      custom_id: "field_" + Date.now().toString(36),
    };
    updateModal(modalId, { fields: [...modal.fields, field] });
  };

  const updateField = (modalId: string, fieldId: string, updates: Partial<ModalField>) => {
    const modal = modals.find((m) => m.id === modalId);
    if (!modal) return;
    const newFields = modal.fields.map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    updateModal(modalId, { fields: newFields });
  };

  const removeField = (modalId: string, fieldId: string) => {
    const modal = modals.find((m) => m.id === modalId);
    if (!modal) return;
    updateModal(modalId, {
      fields: modal.fields.filter((f) => f.id !== fieldId),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Modals</h3>
        <Button size="sm" onClick={addModal}>
          <Plus className="size-4 mr-1" />
          Modal
        </Button>
      </div>

      {modals.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Noch keine Modals. Klicke &quot;+ Modal&quot; um loszulegen.
        </p>
      )}

      {modals.map((modal) => (
        <Card key={modal.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{modal.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {modal.fields.length} Felder
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive"
                onClick={() => removeModal(modal.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Titel</Label>
                <Input
                  value={modal.title}
                  onChange={(e) => updateModal(modal.id, { title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Custom ID</Label>
                <Input
                  value={modal.custom_id}
                  onChange={(e) => updateModal(modal.id, { custom_id: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Felder</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addField(modal.id)}
                  disabled={modal.fields.length >= 5}
                >
                  <Plus className="size-3 mr-1" />
                  Feld
                </Button>
              </div>

              {modal.fields.map((field) => (
                <div key={field.id} className="rounded border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        updateField(modal.id, field.id, { label: e.target.value })
                      }
                      placeholder="Label"
                      className="text-sm h-8"
                    />
                    <Select
                      value={field.style}
                      onValueChange={(v) =>
                        updateField(modal.id, field.id, {
                          style: v as "short" | "paragraph",
                        })
                      }
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Kurz</SelectItem>
                        <SelectItem value="paragraph">Lang</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(v) =>
                          updateField(modal.id, field.id, { required: v })
                        }
                      />
                      <span className="text-xs text-muted-foreground">Req.</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive"
                      onClick={() => removeField(modal.id, field.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={field.placeholder}
                      onChange={(e) =>
                        updateField(modal.id, field.id, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="Placeholder..."
                      className="text-xs h-7"
                    />
                    <Input
                      value={field.custom_id}
                      onChange={(e) =>
                        updateField(modal.id, field.id, {
                          custom_id: e.target.value,
                        })
                      }
                      placeholder="custom_id"
                      className="font-mono text-xs h-7"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
