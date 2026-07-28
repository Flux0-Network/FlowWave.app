"use client";

import React, { use, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronDown, ChevronUp, FolderOpen, FileCode, ArrowLeft, Rocket, Save,
  Eye, EyeOff, RotateCcw, AlertCircle, CheckCircle2, Plus, Trash2, Pencil,
  X, FolderPlus, Bot, Send, Loader2, Sparkles, Blocks, Cog,
  Search, History, Clock,
} from "lucide-react";
import dynamic from "next/dynamic";

const BuilderPage = dynamic(
  () => import("@/app/(app)/builder/page"),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="size-5 animate-spin" /></div> }
);
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

type NodeKind = "file" | "folder";
interface TreeNode {
  kind: NodeKind;
  name: string;
  path: string;
  fileIdx?: number;
  children?: TreeNode[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DeployRecord {
  ts: number;
  ok: boolean;
  msg: string;
}

// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "cogsforge:bots";
const foldersKey = (id: string) => `flowwave:folders:${id}`;
const deploysKey = (id: string) => `flowwave:deploys:${id}`;

function loadBots(): BotProject[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function saveBot(updated: BotProject) {
  const bots = loadBots().map((b) => (b.id === updated.id ? updated : b));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bots));
}

// ── Tree builder ─────────────────────────────────────────────────────────────
function buildTree(files: FileEntry[], emptyFolders: string[]): TreeNode[] {
  const folderMap = new Map<string, TreeNode>();
  const root: TreeNode[] = [];

  function ensureFolder(fp: string): TreeNode[] {
    if (folderMap.has(fp)) return folderMap.get(fp)!.children!;
    const parts = fp.split("/");
    const node: TreeNode = { kind: "folder", name: parts[parts.length - 1], path: fp, children: [] };
    folderMap.set(fp, node);
    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentList = ensureFolder(parts.slice(0, -1).join("/"));
      parentList.push(node);
    }
    return node.children!;
  }

  for (const fp of emptyFolders) ensureFolder(fp);

  for (let i = 0; i < files.length; i++) {
    const parts = files[i].name.split("/");
    if (parts.length === 1) {
      root.push({ kind: "file", name: parts[0], path: files[i].name, fileIdx: i });
    } else {
      const list = ensureFolder(parts.slice(0, -1).join("/"));
      list.push({ kind: "file", name: parts[parts.length - 1], path: files[i].name, fileIdx: i });
    }
  }

  function sort(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => n.children && sort(n.children));
  }
  sort(root);
  return root;
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

// ── Search highlights overlay ─────────────────────────────────────────────────
function SearchHighlights({ text, query, activeIdx }: { text: string; query: string; activeIdx: number }) {
  if (!query) return null;
  const qLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let pos = 0;
  let matchCount = 0;
  let i = textLower.indexOf(qLower);
  while (i !== -1) {
    if (i > pos) parts.push(<span key={`t${pos}`} style={{ color: "transparent" }}>{text.slice(pos, i)}</span>);
    parts.push(
      <span key={`m${i}`} style={{ color: "transparent", background: matchCount === activeIdx ? "rgba(251,191,36,0.45)" : "rgba(251,191,36,0.2)", borderRadius: "2px" }}>
        {text.slice(i, i + query.length)}
      </span>
    );
    pos = i + query.length;
    matchCount++;
    i = textLower.indexOf(qLower, pos);
  }
  if (pos < text.length) parts.push(<span key={`t${pos}`} style={{ color: "transparent" }}>{text.slice(pos)}</span>);
  return <>{parts}</>;
}

// ── AI Assistant panel ────────────────────────────────────────────────────────
function AiPanel({ fileName, fileContent }: { fileName: string; fileContent: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const QUICK = [
    "Erkläre diesen Code",
    "Finde Bugs",
    "Füge Error Handling hinzu",
    "Optimiere den Code",
  ];

  const send = useCallback(async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, fileContent, fileName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Fehler: ${String(e)}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, loading, fileContent, fileName]);

  return (
    <div className="flex flex-col h-full border-l border-white/8 bg-black/30 w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8 shrink-0">
        <Sparkles className="size-3.5 text-violet-400 shrink-0" />
        <span className="text-[11px] font-semibold text-zinc-300">KI-Assistent</span>
        <span className="ml-auto text-[9px] text-zinc-600 font-mono">Claude</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-600 text-center py-2">
              Frag mich etwas über deinen Code
            </p>
            <div className="space-y-1">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 px-2 py-1.5 rounded transition-colors border border-white/5 hover:border-white/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("text-[12px] leading-relaxed", m.role === "user" ? "text-zinc-400" : "text-zinc-200")}>
            {m.role === "user" ? (
              <div className="flex gap-2">
                <span className="text-[9px] text-zinc-600 font-semibold uppercase tracking-wider mt-0.5 shrink-0">Du</span>
                <p className="flex-1">{m.content}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Sparkles className="size-3 text-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  {m.content.split(/(```[\s\S]*?```)/g).map((part, j) => {
                    if (part.startsWith("```")) {
                      const code = part.replace(/^```\w*\n?/, "").replace(/```$/, "");
                      return (
                        <pre key={j} className="bg-black/40 border border-white/8 rounded p-2 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
                          {code}
                        </pre>
                      );
                    }
                    return <p key={j} className="whitespace-pre-wrap">{part}</p>;
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-zinc-600 text-[11px]">
            <Loader2 className="size-3 animate-spin" />
            Denkt nach…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/8 p-2">
        <div className="flex gap-1.5 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            placeholder="Frage stellen… (Enter zum Senden)"
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 rounded text-[11px] text-zinc-300 placeholder:text-zinc-600 px-2 py-1.5 resize-none focus:outline-none focus:border-violet-500/40 leading-relaxed"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="size-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EditorPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = use(params);
  const router = useRouter();

  const [bot, setBot] = useState<BotProject | null>(null);
  const [files, setFiles] = useState<FileEntry[]>(DEFAULT_FILES);
  const [activeIdx, setActiveIdx] = useState(0);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [extraFolders, setExtraFolders] = useState<string[]>([]);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [creatingRootFolder, setCreatingRootFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editorMode, setEditorMode] = useState<"code" | "builder" | "generator">("code");
  const [showAi, setShowAi] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState("");
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployHistory, setDeployHistory] = useState<DeployRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [rootOpen, setRootOpen] = useState(true);
  const [findQuery, setFindQuery] = useState("");
  const [showFind, setShowFind] = useState(false);
  const [findIdx, setFindIdx] = useState(0);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const findRef = useRef<HTMLInputElement>(null);

  const activeFile = files[activeIdx] ?? files[0];
  const code = activeFile?.content ?? "";
  const tokens = useMemo(() => tokenize(code), [code]);
  const tree = useMemo(() => buildTree(files, extraFolders), [files, extraFolders]);
  const findMatches = useMemo<number[]>(() => {
    if (!findQuery) return [];
    const q = findQuery.toLowerCase();
    const src = code.toLowerCase();
    const results: number[] = [];
    let i = src.indexOf(q);
    while (i !== -1) { results.push(i); i = src.indexOf(q, i + 1); }
    return results;
  }, [code, findQuery]);

  useEffect(() => {
    const found = loadBots().find((b) => b.id === botId);
    if (!found) { router.push("/projects"); return; }
    setBot(found);
    const parsed = parseFiles(found.code);
    setFiles(parsed);
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(foldersKey(botId)) ?? "[]");
      setExtraFolders(saved);
      const auto = new Set<string>();
      parsed.forEach((f) => {
        const parts = f.name.split("/");
        for (let i = 1; i < parts.length; i++) auto.add(parts.slice(0, i).join("/"));
      });
      saved.forEach((fp) => auto.add(fp));
      setOpenFolders(auto);
      const hist: DeployRecord[] = JSON.parse(localStorage.getItem(deploysKey(botId)) ?? "[]");
      setDeployHistory(hist);
    } catch {}
  }, [botId, router]);

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
    localStorage.setItem(foldersKey(botId), JSON.stringify(extraFolders));
    setSaved(true);
  }, [bot, files, botId, extraFolders]);

  const addDeployRecord = useCallback((ok: boolean, msg: string) => {
    const record: DeployRecord = { ts: Date.now(), ok, msg };
    setDeployHistory((prev) => {
      const next = [record, ...prev].slice(0, 10);
      localStorage.setItem(deploysKey(botId), JSON.stringify(next));
      return next;
    });
  }, [botId]);

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
      addDeployRecord(true, "Bot erfolgreich deployed");
      setToken("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Deploy fehlgeschlagen.";
      setDeployError(msg);
      addDeployRecord(false, msg);
    } finally {
      setDeploying(false);
    }
  };

  const handleCursorChange = (ta: HTMLTextAreaElement) => {
    const before = ta.value.slice(0, ta.selectionStart);
    const line = before.split("\n").length;
    const col = before.length - before.lastIndexOf("\n");
    setCursorLine(line);
    setCursorCol(col);
  };

  const gotoMatch = useCallback((idx: number) => {
    if (!findMatches.length || !textareaRef.current) return;
    const i = ((idx % findMatches.length) + findMatches.length) % findMatches.length;
    setFindIdx(i);
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(findMatches[i], findMatches[i] + findQuery.length);
  }, [findMatches, findQuery]);

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
    if ((e.metaKey || e.ctrlKey) && e.key === "f") {
      e.preventDefault();
      setShowFind(true);
      setTimeout(() => findRef.current?.focus(), 50);
    }
  };

  // ── File / folder management ──────────────────────────────────────────────
  const handleNewFile = useCallback((folderPath?: string) => {
    const prefix = folderPath ? `${folderPath}/` : "";
    let base = "neue_datei.py";
    let name = `${prefix}${base}`;
    let n = 1;
    while (files.some((f) => f.name === name)) {
      base = `neue_datei_${n++}.py`;
      name = `${prefix}${base}`;
    }
    const updated = [...files, { name, content: "" }];
    setFiles(updated);
    setActiveIdx(updated.length - 1);
    setSaved(false);
    setRenamingPath(name);
    setRenameName(base);
    if (folderPath) setOpenFolders((prev) => new Set([...prev, folderPath]));
  }, [files]);

  const handleDeleteByPath = useCallback((path: string, kind: NodeKind) => {
    if (kind === "file") {
      const idx = files.findIndex((f) => f.name === path);
      if (idx === -1 || files.length <= 1) return;
      const updated = files.filter((_, i) => i !== idx);
      setFiles(updated);
      setActiveIdx((prev) =>
        prev > idx ? prev - 1 : prev === idx ? Math.max(0, idx - 1) : prev
      );
    } else {
      const prefix = path + "/";
      const updated = files.filter((f) => !f.name.startsWith(prefix));
      if (updated.length === 0) return;
      setFiles(updated);
      setExtraFolders((prev) => prev.filter((fp) => !fp.startsWith(path)));
      setOpenFolders((prev) => {
        const next = new Set(prev);
        for (const k of [...next]) { if (k === path || k.startsWith(prefix)) next.delete(k); }
        return next;
      });
      setActiveIdx((prev) => Math.min(prev, Math.max(0, updated.length - 1)));
    }
    setSaved(false);
  }, [files]);

  const handleRenameCommit = useCallback(() => {
    if (!renamingPath) return;
    const seg = renameName.trim();
    if (!seg) { setRenamingPath(null); return; }
    const parts = renamingPath.split("/");
    parts[parts.length - 1] = seg;
    const newPath = parts.join("/");
    const isFile = files.some((f) => f.name === renamingPath);
    if (isFile) {
      setFiles((prev) => prev.map((f) => f.name === renamingPath ? { ...f, name: newPath } : f));
    } else {
      const prefix = renamingPath + "/";
      setFiles((prev) => prev.map((f) =>
        f.name.startsWith(prefix) ? { ...f, name: newPath + f.name.slice(renamingPath.length) } : f
      ));
      setExtraFolders((prev) => prev.map((fp) =>
        fp === renamingPath || fp.startsWith(prefix)
          ? newPath + fp.slice(renamingPath.length) : fp
      ));
      setOpenFolders((prev) => {
        const next = new Set<string>();
        for (const k of prev) {
          next.add(k === renamingPath || k.startsWith(prefix)
            ? newPath + k.slice(renamingPath.length) : k);
        }
        return next;
      });
    }
    setSaved(false);
    setRenamingPath(null);
  }, [renamingPath, renameName, files]);

  const handleNewFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingRootFolder(false); return; }
    if (!extraFolders.includes(name) && !files.some((f) => f.name.startsWith(name + "/"))) {
      setExtraFolders((prev) => [...prev, name]);
      setOpenFolders((prev) => new Set([...prev, name]));
      setSaved(false);
    }
    setNewFolderName("");
    setCreatingRootFolder(false);
  };

  // ── Tree renderer (recursive, closure over state) ─────────────────────────
  const renderTree = useCallback((nodes: TreeNode[], depth: number): React.ReactNode => {
    return nodes.map((node) => {
      const indent = depth * 12 + 8;
      const isRen = renamingPath === node.path;
      const isHov = hoveredPath === node.path;

      if (node.kind === "folder") {
        const isOpen = openFolders.has(node.path);
        return (
          <React.Fragment key={node.path}>
            <div
              style={{ paddingLeft: `${indent}px` }}
              className="flex items-center gap-1 py-[4px] pr-1 text-[12px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 cursor-pointer select-none"
              onClick={() => setOpenFolders((prev) => {
                const next = new Set(prev);
                if (next.has(node.path)) next.delete(node.path); else next.add(node.path);
                return next;
              })}
              onMouseEnter={() => setHoveredPath(node.path)}
              onMouseLeave={() => setHoveredPath(null)}
            >
              {isOpen
                ? <ChevronDown className="size-3 shrink-0" />
                : <ChevronRight className="size-3 shrink-0" />}
              <FolderOpen className="size-3.5 shrink-0 text-amber-400/70" />
              {isRen ? (
                <input
                  autoFocus
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onBlur={handleRenameCommit}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRenameCommit(); if (e.key === "Escape") setRenamingPath(null); }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 bg-zinc-800 text-zinc-100 text-[11px] font-mono px-1 rounded outline-none border border-blue-500/60 leading-none"
                />
              ) : (
                <span className="truncate leading-none flex-1 min-w-0">{node.name}</span>
              )}
              {isHov && !isRen && (
                <span className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleNewFile(node.path)} title="Neue Datei" className="text-zinc-600 hover:text-zinc-200 p-0.5 rounded"><Plus className="size-2.5" /></button>
                  <button onClick={() => { setRenamingPath(node.path); setRenameName(node.name); }} title="Umbenennen" className="text-zinc-600 hover:text-zinc-200 p-0.5 rounded"><Pencil className="size-2.5" /></button>
                  <button onClick={() => handleDeleteByPath(node.path, "folder")} title="Löschen" className="text-zinc-600 hover:text-red-400 p-0.5 rounded"><Trash2 className="size-2.5" /></button>
                </span>
              )}
            </div>
            {isOpen && node.children && renderTree(node.children, depth + 1)}
          </React.Fragment>
        );
      }

      // File node
      const isActive = node.fileIdx === activeIdx;
      return (
        <div
          key={node.path}
          style={{ paddingLeft: `${indent + 16}px` }}
          className={cn(
            "flex items-center gap-1 py-[4px] pr-1 text-[12px] select-none cursor-pointer",
            isActive ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
          onClick={() => { if (!isRen && node.fileIdx !== undefined) setActiveIdx(node.fileIdx); }}
          onMouseEnter={() => setHoveredPath(node.path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <FileCode className="size-3.5 shrink-0 text-blue-400/70" />
          {isRen ? (
            <input
              autoFocus
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameCommit(); if (e.key === "Escape") setRenamingPath(null); }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-zinc-800 text-zinc-100 text-[11px] font-mono px-1 rounded outline-none border border-blue-500/60 leading-none"
            />
          ) : (
            <span className="truncate leading-none flex-1 min-w-0">{node.name}</span>
          )}
          {isHov && !isRen && (
            <span className="flex items-center gap-0.5 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); setRenamingPath(node.path); setRenameName(node.name); }} title="Umbenennen" className="text-zinc-600 hover:text-zinc-200 p-0.5 rounded"><Pencil className="size-2.5" /></button>
              {files.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); handleDeleteByPath(node.path, "file"); }} title="Löschen" className="text-zinc-600 hover:text-red-400 p-0.5 rounded"><Trash2 className="size-2.5" /></button>
              )}
            </span>
          )}
        </div>
      );
    });
  }, [openFolders, renamingPath, renameName, hoveredPath, activeIdx, files, handleNewFile, handleDeleteByPath, handleRenameCommit]);

  if (!bot) return null;

  return (
    <div className="flex flex-col h-screen bg-[oklch(0.07_0.014_258)] text-zinc-300 overflow-hidden">
      {/* Title bar */}
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
          <button
            onClick={() => setShowAi((v) => !v)}
            title="KI-Assistent"
            className={cn(
              "flex items-center gap-1 h-6 px-2 text-[11px] rounded transition-colors",
              showAi ? "text-violet-300 bg-violet-500/20" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <Bot className="size-3" />
            KI
          </button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1 text-zinc-400 hover:text-zinc-200" onClick={handleSave}>
            <Save className="size-3" />
            Speichern
          </Button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-white/8 bg-black/20 shrink-0">
        {([
          { key: "code", label: "Code Editor", Icon: null },
          { key: "builder", label: "Builder", Icon: Blocks },
          { key: "generator", label: "Generator", Icon: Cog },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setEditorMode(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium transition-colors",
              editorMode === key
                ? "bg-white/10 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            {Icon && <Icon className="size-3" />}
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        {editorMode === "builder" && <BuilderPage embedded initialMode="components" />}
        {editorMode === "generator" && <BuilderPage embedded initialMode="cog" />}
        {/* Sidebar + Editor + AI (code mode only) */}
        {editorMode === "code" && <><div className="w-48 shrink-0 border-r border-white/8 bg-black/20 flex flex-col">
          {/* Explorer header */}
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-[9px] text-zinc-600 font-semibold uppercase tracking-widest select-none">
              Explorer
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setCreatingRootFolder(true); setNewFolderName(""); }}
                title="Neuer Ordner"
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <FolderPlus className="size-3.5" />
              </button>
              <button
                onClick={() => handleNewFile()}
                title="Neue Datei"
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Root folder label */}
          <div
            className="flex items-center gap-1 py-[4px] px-2 text-[12px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 cursor-pointer select-none"
            onClick={() => setRootOpen((v) => !v)}
          >
            {rootOpen
              ? <ChevronDown className="size-3 shrink-0" />
              : <ChevronRight className="size-3 shrink-0" />}
            <FolderOpen className="size-3.5 shrink-0 text-amber-400/70" />
            <span className="truncate leading-none">{bot.name.toLowerCase().replace(/\s+/g, "-")}</span>
          </div>

          {rootOpen && <>
            {/* Inline new folder input */}
            {creatingRootFolder && (
              <div className="flex items-center gap-1 py-[3px] px-3 ml-4">
                <FolderOpen className="size-3.5 shrink-0 text-amber-400/50" />
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={handleNewFolder}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNewFolder(); if (e.key === "Escape") setCreatingRootFolder(false); }}
                  placeholder="Ordnername…"
                  className="flex-1 min-w-0 bg-zinc-800 text-zinc-100 text-[11px] font-mono px-1 rounded outline-none border border-blue-500/60 leading-none"
                />
              </div>
            )}

            {/* Tree */}
            <div className="flex-1 overflow-y-auto">
              {renderTree(tree, 0)}
            </div>
          </>}
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
                <span>{file.name.split("/").pop()}</span>
                {files.length > 1 && (
                  <X
                    className="size-2.5 ml-1 text-zinc-600 hover:text-zinc-300"
                    onClick={(e) => { e.stopPropagation(); handleDeleteByPath(file.name, "file"); }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Find bar */}
          {showFind && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/8 bg-black/30 shrink-0">
              <Search className="size-3 text-zinc-500 shrink-0" />
              <input
                ref={findRef}
                value={findQuery}
                onChange={(e) => { setFindQuery(e.target.value); setFindIdx(0); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); gotoMatch(e.shiftKey ? findIdx - 1 : findIdx + 1); }
                  if (e.key === "Escape") { setShowFind(false); setFindQuery(""); textareaRef.current?.focus(); }
                }}
                placeholder="Suchen… (Enter = weiter, Esc = schließen)"
                className="flex-1 bg-transparent text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none font-mono"
              />
              {findQuery && (
                <span className="text-[10px] text-zinc-500 shrink-0">
                  {findMatches.length === 0 ? "Keine Treffer" : `${Math.min(findIdx + 1, findMatches.length)} / ${findMatches.length}`}
                </span>
              )}
              <button onClick={() => { gotoMatch(findIdx - 1); }} disabled={!findMatches.length} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 p-0.5"><ChevronUp className="size-3" /></button>
              <button onClick={() => { gotoMatch(findIdx + 1); }} disabled={!findMatches.length} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 p-0.5"><ChevronDown className="size-3" /></button>
              <button onClick={() => { setShowFind(false); setFindQuery(""); textareaRef.current?.focus(); }} className="text-zinc-500 hover:text-zinc-300 p-0.5"><X className="size-3" /></button>
            </div>
          )}

          {/* Syntax-highlighted editor */}
          <div className="flex-1 overflow-auto min-h-0">
            <div className="relative min-h-full">
              <pre
                aria-hidden
                className="invisible p-4 m-0 font-mono text-[13px] leading-[1.75] whitespace-pre"
                style={{ minWidth: "100%" }}
              >
                {code + "\n"}
              </pre>
              <pre
                aria-hidden
                className="absolute inset-0 p-4 m-0 font-mono text-[13px] leading-[1.75] whitespace-pre pointer-events-none text-[#abb2bf]"
              >
                <code><Highlighted tokens={tokens} /></code>
              </pre>
              {showFind && findQuery && (
                <pre
                  aria-hidden
                  className="absolute inset-0 p-4 m-0 font-mono text-[13px] leading-[1.75] whitespace-pre pointer-events-none select-none"
                >
                  <SearchHighlights text={code} query={findQuery} activeIdx={findIdx} />
                </pre>
              )}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onSelect={(e) => handleCursorChange(e.currentTarget)}
                onClick={(e) => handleCursorChange(e.currentTarget)}
                onKeyUp={(e) => handleCursorChange(e.currentTarget)}
                className="absolute inset-0 w-full h-full bg-transparent font-mono text-[13px] leading-[1.75] p-4 resize-none focus:outline-none"
                style={{ color: "transparent", caretColor: "#c8cdd4" }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>
        </div>

        {/* AI Panel */}
        {showAi && <AiPanel fileName={activeFile?.name ?? ""} fileContent={code} />}
        </>}
      </div>

      {/* Deploy history dropdown */}
      {showHistory && deployHistory.length > 0 && (
        <div className="shrink-0 border-t border-white/8 bg-black/50 px-4 py-2 max-h-40 overflow-y-auto">
          <p className="text-[9px] text-zinc-600 font-semibold uppercase tracking-widest mb-1.5">Deploy-Verlauf</p>
          <div className="space-y-1">
            {deployHistory.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                {r.ok
                  ? <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  : <AlertCircle className="size-3 text-red-400 shrink-0" />}
                <span className={r.ok ? "text-emerald-400" : "text-red-400"}>{r.msg}</span>
                <span className="ml-auto text-zinc-600 font-mono text-[10px] flex items-center gap-1 shrink-0">
                  <Clock className="size-2.5" />
                  {new Date(r.ts).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-white/8 bg-black/40 px-4 py-2 flex items-center gap-3">
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
            Bot deployed!
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {editorMode === "code" && (
            <span className="text-[10px] text-zinc-600 font-mono hidden sm:block">
              Zeile {cursorLine}, Sp. {cursorCol}
            </span>
          )}
          <span className={cn("size-2 rounded-full", bot.status === "running" ? "bg-emerald-400" : "bg-zinc-600")} />
          <span className="text-[11px] text-zinc-500">
            {bot.status === "running" ? "Online" : "Offline"}
          </span>
          {deployHistory.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              title="Deploy-Verlauf"
              className={cn("flex items-center gap-1 h-7 px-2 text-[11px] rounded transition-colors", showHistory ? "text-zinc-300 bg-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
            >
              <History className="size-3" />
              {deployHistory.filter(r => r.ok).length}/{deployHistory.length}
            </button>
          )}
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
