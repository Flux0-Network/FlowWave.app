"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download } from "lucide-react";

interface CodeOutputProps {
  code: string;
}

export function CodeOutput({ code }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "components_v2.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col rounded-xl border border-border overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/70 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground">
            components_v2.py
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
            Python
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Code body */}
      <div className="flex-1 overflow-auto bg-[oklch(0.072_0.013_258)]">
        <pre className="p-4 text-[12.5px] font-mono leading-[1.65] text-[#abb2bf] overflow-x-auto whitespace-pre min-h-full">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
