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
import { Plus, Trash2, Database } from "lucide-react";
import type { SqliteTable, SqliteColumn } from "@/types/generator";

interface SqliteBuilderProps {
  tables: SqliteTable[];
  onChange: (tables: SqliteTable[]) => void;
}

let colCounter = 0;
function genColId() {
  colCounter++;
  return `col_${colCounter}_${Date.now().toString(36)}`;
}

let tableCounter = 0;
function genTableId() {
  tableCounter++;
  return `tbl_${tableCounter}_${Date.now().toString(36)}`;
}

export function SqliteBuilder({ tables, onChange }: SqliteBuilderProps) {
  const addTable = () => {
    const table: SqliteTable = {
      id: genTableId(),
      name: "neue_tabelle",
      columns: [
        {
          id: genColId(),
          name: "id",
          type: "INTEGER",
          primary_key: true,
          not_null: true,
        },
      ],
    };
    onChange([...tables, table]);
  };

  const updateTable = (id: string, updates: Partial<SqliteTable>) => {
    onChange(tables.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeTable = (id: string) => {
    onChange(tables.filter((t) => t.id !== id));
  };

  const addColumn = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const col: SqliteColumn = {
      id: genColId(),
      name: "spalte",
      type: "TEXT",
      primary_key: false,
      not_null: false,
    };
    updateTable(tableId, { columns: [...table.columns, col] });
  };

  const updateColumn = (
    tableId: string,
    colId: string,
    updates: Partial<SqliteColumn>
  ) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const newCols = table.columns.map((c) =>
      c.id === colId ? { ...c, ...updates } : c
    );
    updateTable(tableId, { columns: newCols });
  };

  const removeColumn = (tableId: string, colId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    updateTable(tableId, {
      columns: table.columns.filter((c) => c.id !== colId),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Database className="size-4" />
          SQLite Tabellen
        </h3>
        <Button size="sm" onClick={addTable}>
          <Plus className="size-4 mr-1" />
          Tabelle
        </Button>
      </div>

      {tables.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Noch keine Tabellen. Klicke &quot;+ Tabelle&quot; um loszulegen.
        </p>
      )}

      {tables.map((table) => (
        <Card key={table.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-mono">{table.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {table.columns.length} Spalten
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive"
                onClick={() => removeTable(table.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-1.5">
              <Label className="text-xs">Tabellenname</Label>
              <Input
                value={table.name}
                onChange={(e) =>
                  updateTable(table.id, {
                    name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                  })
                }
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Spalten</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addColumn(table.id)}
                >
                  <Plus className="size-3 mr-1" />
                  Spalte
                </Button>
              </div>

              {table.columns.map((col) => (
                <div key={col.id} className="flex items-center gap-2 rounded border p-2">
                  <Input
                    value={col.name}
                    onChange={(e) =>
                      updateColumn(table.id, col.id, {
                        name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                      })
                    }
                    placeholder="name"
                    className="font-mono text-xs h-8"
                  />
                  <Select
                    value={col.type}
                    onValueChange={(v) =>
                      updateColumn(table.id, col.id, {
                        type: v as SqliteColumn["type"],
                      })
                    }
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">TEXT</SelectItem>
                      <SelectItem value="INTEGER">INTEGER</SelectItem>
                      <SelectItem value="REAL">REAL</SelectItem>
                      <SelectItem value="BLOB">BLOB</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={col.primary_key}
                      onCheckedChange={(v) =>
                        updateColumn(table.id, col.id, { primary_key: v })
                      }
                    />
                    <span className="text-xs text-muted-foreground">PK</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={col.not_null}
                      onCheckedChange={(v) =>
                        updateColumn(table.id, col.id, { not_null: v })
                      }
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">NN</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive"
                    onClick={() => removeColumn(table.id, col.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
