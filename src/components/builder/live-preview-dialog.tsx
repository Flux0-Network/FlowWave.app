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
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import type { BuilderComponent } from "@/types/builder";

interface LivePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: BuilderComponent[];
}

export function LivePreviewDialog({
  open,
  onOpenChange,
  components,
}: LivePreviewDialogProps) {
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    if (!botToken || !channelId) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/bot-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken,
          channelId,
          components,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Unbekannter Fehler");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5" />
            Live Bot Preview
          </DialogTitle>
          <DialogDescription>
            Sende dein Layout direkt in einen Discord-Channel, um es live zu testen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Dein Bot-Token wird nur für diese Anfrage verwendet und nicht gespeichert.
              Der Token wird serverseitig an die Discord API gesendet.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="botToken">Bot Token</Label>
            <Input
              id="botToken"
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="MTIz..."
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channelId">Channel ID</Label>
            <Input
              id="channelId"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="1234567890123456789"
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              {status === "success" && (
                <Badge variant="secondary" className="gap-1 text-green-600">
                  <CheckCircle2 className="size-3" />
                  Gesendet!
                </Badge>
              )}
              {status === "error" && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  {errorMsg.slice(0, 80)}
                </div>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!botToken || !channelId || status === "sending" || components.length === 0}
              className="gap-2"
            >
              {status === "sending" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              An Discord senden
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Komponenten: {components.length} | Der Bot muss Zugriff auf den Channel haben.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
