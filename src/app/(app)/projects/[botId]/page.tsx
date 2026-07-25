"use client";

import { use, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronDown, FolderOpen, FileCode, ArrowLeft, Rocket, Save,
  Eye, EyeOff, RotateCcw, AlertCircle, CheckCircle2, Plus, Trash2, Pencil,
  Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Tokenizer (One Dark) ─────────────────────────────────────────────────────
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
    if (ch === "\n" || ch === "\r") { push(ch, null); i++; continue; }
    if (ch === " " || ch === "\t") {
      let j = i;
      while (j < len && (code[j] === " " || code[j] === "\t")) j++;
      push(code.slice(i, j), null); i = j; continue;
    }
    if (ch === "#") {
      let j = i;
      while (j < len && code[j] !== "\n" && code[j] !== "\r") j++;
      push(code.slice(i, j), "code-cmt"); i = j; continue;
    }
    if (ch === "@") {
      let j = i + 1;
      while (j < len && /[\w.]/.test(code[j])) j++;
      push(code.slice(i, j), "code-dec"); i = j; continue;
    }
    if ((ch === '"' || ch === "'") && code[i + 1] === ch && code[i + 2] === ch) {
      const q = ch.repeat(3); let j = i + 3;
      while (j < len && code.slice(j, j + 3) !== q) j++;
      j += 3; push(code.slice(i, j), "code-str"); i = j; continue;
    }
    if (/[fFrRbBuU]/.test(ch) && (code[i + 1] === '"' || code[i + 1] === "'")) {
      const q = code[i + 1]; let j = i + 2;
      while (j < len && code[j] !== q && code[j] !== "\n") { if (code[j] === "\\") j++; j++; }
      j++; push(code.slice(i, j), "code-str"); i = j; continue;
    }
    if (ch === '"' || ch === "'") {
      const q = ch; let j = i + 1;
      while (j < len && code[j] !== q && code[j] !== "\n") { if (code[j] === "\\") j++; j++; }
      j++; push(code.slice(i, j), "code-str"); i = j; continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(code[i + 1] ?? ""))) {
      let j = i;
      while (j < len && /[0-9_.xXbBoOeEjJ]/.test(code[j])) j++;
      push(code.slice(i, j), "code-num"); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < len && /[\w]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const prevTok = tokens[tokens.length - 1];
      const afterDot = prevTok?.text === ".";
      const nextCh = code[j];
      const afterParen = nextCh === "(";
      if (KEYWORDS.has(word)) push(word, "code-kw");
      else if (afterDot) {
        if (afterParen) push(word, "code-fn");
        else if (/^[A-Z]/.test(word)) push(word, "code-cls");
        else push(word, "code-mod");
      } else if (afterParen) push(word, "code-fn");
      else if (KNOWN_MODULES.has(word)) push(word, "code-mod");
      else if (/^[A-Z]/.test(word) && word !== word.toUpperCase()) push(word, "code-cls");
      else push(word, null);
      i = j; continue;
    }
    push(ch, null); i++;
  }
  return tokens;
}

// ── Types ────────────────────────────────────────────────────────────────────
interface BotProject {
  id: string;
  name: string;
  clientId: string;
  status: string;
  createdAt: string;
  code: string;
}

interface FileEntry {
  name: string;
  content: string;
}

// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "cogsforge:bots";

function loadBots(): BotProject[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function saveBot(updated: BotProject) {
  const bots = loadBots().map((b) => (b.id === updated.id ? updated : b));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
}

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_CODE = `import discord
from discord.ext import commands
import os

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'Eingeloggt als {bot.user}')

@bot.command()
async def ping(ctx):
    await ctx.send('Pong!')

bot.run(os.environ['DISCORD_TOKEN'])
`;

const DEFAULT_FILES: FileEntry[] = [
  { name: "bot.py", content: DEFAULT_CODE },
  { name: "requirements.txt", content: "discord.py\n" },
];

function parseFiles(raw: string): FileEntry[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].name === "string") {
      return parsed as FileEntry[];
    }
  } catch { /* not JSON */ }
  return [{ name: "bot.py", content: raw ?? DEFAULT_CODE }, { name: "requirements.txt", content: "discord.py\n" }];
}

// ── Highlighted tokens renderer ───────────────────────────────────────────────
function Highlighted({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((tok, idx) =>
        tok.cls ? <span key={idx} className={tok.cls}>{tok.text}</span> : tok.text
      )}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EditorPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = use(params);
  const router = useRouter();

  const [bot, setBot] = useState<BotProject | null>(null);
  const [files, setFiles] = useState<FileEntry[]>(DEFAULT_FILES);
  const [activeIdx, setActiveIdx] = useState(0);
  const [folderOpen, setFolderOpen] = useState(true);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState("");
  const [deploySuccess, setDeploySuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeFile = files[activeIdx] ?? files[0];
  const code = activeFile?.content ?? "";
  const tokens = useMemo(() => tokenize(code), [code]);

  useEffect(() => {
    const found = loadBots().find((b) => b.id === botId);
    if (!found) { router.push("/projects"); return; }
    setBot(found);
    setFiles(parseFiles(found.code));
  }, [botId, router]);

  useEffect(() => {
    if (renamingIdx !== null) renameInputRef.current?.select();
  }, [renamingIdx]);

  const setCode = useCallback((newCode: string) => {
    setFiles((prev) => prev.map((f, i) => i === activeIdx ? { ...f, content: newCode } : f));
    setSaved(false);
    setDeploySuccess(false);
  }, [activeIdx]);

  const handleSave = useCallback(() => {
    if (!bot) return;
    const updated = { ...bot, code: JSON.stringify(files) };
    saveBot(updated);
    setBot(updated);
    setSaved(true);
  }, [bot, files]);

  const handleDeploy = async () => {
    if (!bot || !token.trim()) { setDeployError("Token erforderlich."); return; }
    setDeploying(true); setDeployError(""); setDeploySuccess(false);
    try {
      handleSave();
      const res = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: bot.id, code, token: token.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Deploy fehlgeschlagen.");
      }
      const bots = loadBots().map((b) =>
        b.id === bot.id ? { ...b, code: JSON.stringify(files), status: "running" } : b
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
      setBot((prev) => prev ? { ...prev, status: "running" } : prev);
      setDeploySuccess(true);
      setToken("");
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Deploy fehlgeschlagen.");
    } finally {
      setDeploying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = code.substring(0, start) + "    " + code.substring(end);
      setCode(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  // ── File management ───────────────────────────────────────────────────────
  const handleNewFile = () => {
    const baseName = "neue_datei.py";
    let name = baseName;
    let n = 1;
    while (files.some((f) => f.name === name)) { name = `neue_datei_${n++}.py`; }
    const updated = [...files, { name, content: "" }];
    setFiles(updated);
    const newIdx = updated.length - 1;
    setActiveIdx(newIdx);
    setSaved(false);
    setRenamingIdx(newIdx);
    setRenameValue(name);
  };

  const handleDeleteFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    setActiveIdx((prev) => (prev >= updated.length ? updated.length - 1 : prev === idx ? Math.max(0, idx - 1) : prev > idx ? prev - 1 : prev));
    setSaved(false);
  };

  const handleStartRename = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingIdx(idx);
    setRenameValue(files[idx].name);
  };

  const handleCommitRename = () => {
    if (renamingIdx === null) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      setFiles((prev) => prev.map((f, i) => i === renamingIdx ? { ...f, name: trimmed } : f));
      setSaved(false);
    }
    setRenamingIdx(null);
  };

  const handleRenameKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCommitRename();
    if (e.key === "Escape") setRenamingIdx(null);
  };

  if (!bot) return null;

  return (
    <div className="flex flex-col h-screen bg-[oklch(0.07_0.014_258)] text-zinc-300 overflow-hidden">
      {/* Title bar — no macOS dots */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-black/30 shrink-0">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          <ArrowLeft className="size-3" />
          Dashboard
        </Link>
        <span className="text-[11px] text-zinc-500 font-mono flex-1 text-center select-none">
          {bot.name} — {activeFile?.name ?? ""}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", saved ? "text-zinc-600" : "text-amber-400/80 bg-amber-400/10")}>
            {saved ? "Gespeichert" : "Ungespeichert"}
          </span>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1 text-zinc-400 hover:text-zinc-200" onClick={handleSave}>
            <Save className="size-3" />
            Speichern
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-white/8 bg-black/20 flex flex-col">
          {/* Explorer header */}
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-[9px] text-zinc-600 font-semibold uppercase tracking-widest select-none">
              Explorer
            </p>
            <button
              onClick={handleNewFile}
              title="Neue Datei"
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Folder row */}
          <button
            onClick={() => setFolderOpen((v) => !v)}
            className="flex items-center gap-1 py-[4px] px-2 text-[12px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 w-full select-none"
          >
            {folderOpen
              ? <ChevronDown className="size-3 shrink-0 text-zinc-500" />
              : <ChevronRight className="size-3 shrink-0 text-zinc-500" />
            }
            <FolderOpen className="size-3.5 shrink-0 text-amber-400/70" />
            <span className="truncate leading-none">{bot.name.toLowerCase().replace(/\s+/g, "-")}</span>
          </button>

          {/* File entries */}
          {folderOpen && files.map((file, idx) => (
            <div
              key={idx}
              onClick={() => { if (renamingIdx !== idx) setActiveIdx(idx); }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={cn(
                "group flex items-center gap-1 py-[4px] text-[12px] select-none cursor-default relative",
                activeIdx === idx
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
              style={{ paddingLeft: "20px" }}
            >
              <span className="w-3 shrink-0" />
              <FileCode className="size-3.5 shrink-0 text-blue-400/70 shrink-0" />

              {renamingIdx === idx ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleCommitRename}
                  onKeyDown={handleRenameKey}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 bg-zinc-800 text-zinc-100 text-[11px] font-mono px-1 rounded outline-none border border-blue-500/60 leading-none"
                />
              ) : (
                <span className="truncate leading-none flex-1 min-w-0">{file.name}</span>
              )}

              {/* Hover action buttons */}
              {hoveredIdx === idx && renamingIdx !== idx && (
                <span className="flex items-center gap-0.5 absolute right-1">
                  <button
                    onClick={(e) => handleStartRename(idx, e)}
                    title="Umbenennen"
                    className="text-zinc-600 hover:text-zinc-200 p-0.5 rounded"
                  >
                    <Pencil className="size-2.5" />
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteFile(idx, e)}
                      title="Löschen"
                      className="text-zinc-600 hover:text-red-400 p-0.5 rounded"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex border-b border-white/8 bg-black/10 shrink-0 overflow-x-auto">
            {files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 border-r border-white/8 text-[12px] whitespace-nowrap shrink-0 transition-colors",
                  activeIdx === idx
                    ? "bg-white/5 text-zinc-300"
                    : "text-zinc-600 hover:text-zinc-400 hover:bg-white/3"
                )}
              >
                <FileCode className="size-3 text-blue-400/80 shrink-0" />
                <span>{file.name}</span>
                {files.length > 1 && (
                  <X
                    className="size-2.5 ml-1 text-zinc-600 hover:text-zinc-300"
                    onClick={(e) => handleDeleteFile(idx, e)}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Syntax-highlighted editor */}
          <div className="flex-1 overflow-auto min-h-0">
            <div className="relative min-h-full">
              {/* Invisible spacer — sets content height */}
              <pre
                aria-hidden
                className="invisible p-4 m-0 font-mono text-[13px] leading-[1.75] whitespace-pre"
                style={{ minWidth: "100%" }}
              >
                {code + "\n"}
              </pre>

              {/* Highlighted code layer */}
              <pre
                aria-hidden
                className="absolute inset-0 p-4 m-0 font-mono text-[13px] leading-[1.75] whitespace-pre pointer-events-none text-[#abb2bf]"
              >
                <code><Highlighted tokens={tokens} /></code>
              </pre>

              {/* Input layer */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 w-full h-full bg-transparent font-mono text-[13px] leading-[1.75] p-4 resize-none focus:outline-none"
                style={{ color: "transparent", caretColor: "#c8cdd4" }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-white/8 bg-black/40 px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 relative max-w-sm">
          <Input
            type={showToken ? "text" : "password"}
            placeholder="Bot Token — für Deploy"
            value={token}
            onChange={(e) => { setToken(e.target.value); setDeployError(""); setDeploySuccess(false); }}
            className="h-7 pr-8 font-mono text-[11px] bg-white/5 border-white/10 text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
          >
            {showToken ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          </button>
        </div>

        {deployError && (
          <div className="flex items-center gap-1.5 text-[11px] text-red-400">
            <AlertCircle className="size-3 shrink-0" />
            {deployError}
          </div>
        )}
        {deploySuccess && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="size-3 shrink-0" />
            Bot läuft!
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className={cn("size-2 rounded-full", bot.status === "running" ? "bg-emerald-400" : "bg-zinc-600")} />
          <span className="text-[11px] text-zinc-500">
            {bot.status === "running" ? "Online" : "Offline"}
          </span>
          <Button size="sm" className="h-7 gap-1.5 text-[11px]" onClick={handleDeploy} disabled={deploying}>
            {deploying ? (
              <><RotateCcw className="size-3 animate-spin" />Deploying…</>
            ) : (
              <><Rocket className="size-3" />Deployen</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
