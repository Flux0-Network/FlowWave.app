"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download } from "lucide-react";

type Token = { text: string; cls: string | null };

const KEYWORDS = new Set([
  "import","from","class","def","async","await","return","if","else","elif",
  "for","while","in","not","and","or","True","False","None","pass","break",
  "continue","try","except","finally","with","as","raise","yield","lambda","self",
  "is","del","global","nonlocal","assert","print",
]);

const KNOWN_MODULES = new Set([
  "discord","commands","asyncio","os","sys","json","aiosqlite","sqlite3",
  "typing","datetime","re","math","random","pathlib","collections","functools",
  "itertools","enum","dataclasses","abc","io","time","logging","traceback",
]);

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = code.length;

  const push = (text: string, cls: string | null) => tokens.push({ text, cls });

  while (i < len) {
    const ch = code[i];

    if (ch === "\n" || ch === "\r") {
      push(ch, null);
      i++;
      continue;
    }
    if (ch === " " || ch === "\t") {
      let j = i;
      while (j < len && (code[j] === " " || code[j] === "\t")) j++;
      push(code.slice(i, j), null);
      i = j;
      continue;
    }

    // Comment
    if (ch === "#") {
      let j = i;
      while (j < len && code[j] !== "\n" && code[j] !== "\r") j++;
      push(code.slice(i, j), "code-cmt");
      i = j;
      continue;
    }

    // Decorator
    if (ch === "@") {
      let j = i + 1;
      while (j < len && /[\w.]/.test(code[j])) j++;
      push(code.slice(i, j), "code-dec");
      i = j;
      continue;
    }

    // Triple-quoted string
    if (
      (ch === '"' || ch === "'") &&
      code[i + 1] === ch && code[i + 2] === ch
    ) {
      const q = ch.repeat(3);
      let j = i + 3;
      while (j < len && code.slice(j, j + 3) !== q) j++;
      j += 3;
      push(code.slice(i, j), "code-str");
      i = j;
      continue;
    }

    // String with f/r/b prefix
    if (/[fFrRbBuU]/.test(ch) && (code[i + 1] === '"' || code[i + 1] === "'")) {
      const q = code[i + 1];
      let j = i + 2;
      while (j < len && code[j] !== q && code[j] !== "\n") {
        if (code[j] === "\\") j++;
        j++;
      }
      j++;
      push(code.slice(i, j), "code-str");
      i = j;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < len && code[j] !== q && code[j] !== "\n") {
        if (code[j] === "\\") j++;
        j++;
      }
      j++;
      push(code.slice(i, j), "code-str");
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(code[i + 1] ?? ""))) {
      let j = i;
      while (j < len && /[0-9_.xXbBoOeEjJ]/.test(code[j])) j++;
      push(code.slice(i, j), "code-num");
      i = j;
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < len && /[\w]/.test(code[j])) j++;
      const word = code.slice(i, j);

      const prevTok = tokens[tokens.length - 1];
      const afterDot = prevTok?.text === ".";
      const nextCh = code[j];
      const afterParen = nextCh === "(";

      if (KEYWORDS.has(word)) {
        push(word, "code-kw");
      } else if (afterDot) {
        if (afterParen) push(word, "code-fn");
        else if (/^[A-Z]/.test(word)) push(word, "code-cls");
        else push(word, "code-mod");
      } else if (afterParen) {
        push(word, "code-fn");
      } else if (KNOWN_MODULES.has(word)) {
        push(word, "code-mod");
      } else if (/^[A-Z]/.test(word) && word !== word.toUpperCase()) {
        push(word, "code-cls");
      } else {
        push(word, null);
      }
      i = j;
      continue;
    }

    push(ch, null);
    i++;
  }

  return tokens;
}

interface CodeOutputProps {
  code: string;
}

export function CodeOutput({ code }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);
  const tokens = useMemo(() => tokenize(code), [code]);

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

      <div className="flex-1 overflow-auto bg-[oklch(0.072_0.013_258)]">
        <pre className="p-4 text-[12.5px] font-mono leading-[1.65] text-[#abb2bf] overflow-x-auto whitespace-pre min-h-full">
          <code>
            {tokens.map((tok, idx) =>
              tok.cls ? (
                <span key={idx} className={tok.cls}>{tok.text}</span>
              ) : (
                tok.text
              )
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
