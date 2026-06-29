"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Download, Upload } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: BuilderComponent[];
}

export function ShareDialog({ open, onOpenChange, components }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState("");

  const jsonExport = JSON.stringify(components, null, 2);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/builder?state=${encodeURIComponent(btoa(JSON.stringify(components)))}`
    : "";

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(jsonExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonExport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flowwave-layout.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed)) {
        const event = new CustomEvent("flowwave:import", { detail: parsed });
        window.dispatchEvent(event);
        onOpenChange(false);
      }
    } catch {
      // invalid JSON
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Teilen & Exportieren</DialogTitle>
          <DialogDescription>
            Teile dein Layout per Link, exportiere als JSON oder importiere ein bestehendes Layout.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link">
          <TabsList className="w-full">
            <TabsTrigger value="link" className="flex-1">Share Link</TabsTrigger>
            <TabsTrigger value="json" className="flex-1">JSON Export</TabsTrigger>
            <TabsTrigger value="import" className="flex-1">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label>Share URL</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Der State wird in der URL kodiert — kein Account nötig.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-3 mt-4">
            <pre className="text-xs font-mono bg-muted rounded-md p-3 max-h-48 overflow-auto">
              {jsonExport}
            </pre>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyJson} className="gap-1">
                <Copy className="size-3" />
                Kopieren
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadJson} className="gap-1">
                <Download className="size-3" />
                Download
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label>JSON einfügen</Label>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"id":"...","type":"container",...}]'
                className="w-full h-32 rounded-md border bg-muted p-3 text-xs font-mono resize-none"
              />
            </div>
            <Button size="sm" onClick={handleImport} className="gap-1">
              <Upload className="size-3" />
              Importieren
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
