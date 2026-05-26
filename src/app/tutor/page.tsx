"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/constants";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface Concept {
  id: string;
  slug: string;
  title: string;
  category: string;
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("# "))  return <h3 key={i} className="text-base font-bold text-white mt-2">{line.slice(2)}</h3>;
        if (line.startsWith("## ")) return <h4 key={i} className="text-sm font-semibold text-white mt-2">{line.slice(3)}</h4>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#52525b] mt-0.5 shrink-0">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          const [num, ...rest] = line.split(". ");
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#52525b] shrink-0 font-mono text-xs mt-0.5">{num}.</span>
              <span>{renderInline(rest.join(". "))}</span>
            </div>
          );
        }
        if (line === "") return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="text-amber-300 bg-[#27272a] rounded px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

const STARTERS = [
  "Explain this concept like I'm a junior engineer",
  "What's the most common interview question about this?",
  "Give me a real-world architecture example",
  "What are the gotchas I need to know?",
  "How does this compare to alternatives?",
];

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/concepts/list")
      .then((r) => r.json())
      .then((d) => setConcepts(d.concepts ?? []));
  }, []);

  useEffect(() => {
    setLoadingHistory(true);
    const url = selectedConcept ? `/api/chat?conceptId=${selectedConcept.id}` : "/api/chat";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setMessages(d.messages ?? []); setLoadingHistory(false); });
  }, [selectedConcept]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, conceptId: selectedConcept?.id }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: snap }; return next; });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Check that ANTHROPIC_API_KEY is set." };
        return next;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, streaming, selectedConcept]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isEmpty = messages.length === 0 && !loadingHistory;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#09090b]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#27272a] bg-[#09090b] shrink-0">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#71717a] hover:text-white transition-colors shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            AI
          </div>
          <span className="text-sm font-semibold text-white">AI Tutor</span>
        </div>
        <div className="flex-1" />
        <select
          value={selectedConcept?.id ?? ""}
          onChange={(e) => { const c = concepts.find((c) => c.id === e.target.value) ?? null; setSelectedConcept(c); }}
          className="rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-1.5 text-xs text-[#a1a1aa] focus:outline-none focus:border-indigo-500/50 max-w-52 transition-colors"
        >
          <option value="">General (no context)</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>{CATEGORY_META[c.category]?.icon} {c.title}</option>
          ))}
        </select>
        {selectedConcept && (
          <Link href={`/concept/${selectedConcept.slug}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0">
            View →
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
        {isEmpty && (
          <div className="max-w-xl mx-auto text-center space-y-6 pt-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-indigo-500/20">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">AI Tutor</h2>
              <p className="text-sm text-[#71717a] leading-relaxed">
                Ask me anything about{" "}
                {selectedConcept ? (
                  <span className="text-indigo-400">{selectedConcept.title}</span>
                ) : "system design, cloud, DevOps, or AI/ML"}.
                {" "}I use the Socratic method — expect questions back!
              </p>
            </div>
            {selectedConcept && (
              <div className="grid gap-2 text-left">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-[#27272a] bg-[#111113] px-4 py-3 text-sm text-[#71717a] hover:border-indigo-500/30 hover:text-white hover:bg-[#18181b] transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loadingHistory && (
          <div className="flex justify-center gap-1 pt-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3f3f46] bounce-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3f3f46] bounce-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3f3f46] bounce-dot" />
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-5 w-full">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                msg.role === "user" ? "bg-indigo-600 text-white" : "bg-[#27272a] text-[#71717a]"
              )}>
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div className={cn(
                "flex-1 min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-indigo-600 text-white max-w-lg ml-auto"
                  : "bg-[#111113] border border-[#27272a] text-[#a1a1aa]"
              )}>
                {msg.role === "assistant" ? (
                  msg.content ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    <span className="inline-flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52525b] bounce-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52525b] bounce-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52525b] bounce-dot" />
                    </span>
                  )
                ) : msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#27272a] bg-[#09090b] px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={selectedConcept ? `Ask about ${selectedConcept.title}…` : "Ask any engineering question…"}
            rows={1}
            disabled={streaming}
            className="flex-1 rounded-xl border border-[#27272a] bg-[#111113] px-4 py-3 text-sm text-[#e4e4e7] placeholder-[#3f3f46] focus:outline-none focus:border-indigo-500/50 resize-none disabled:opacity-50 transition-colors"
            style={{ maxHeight: "8rem", overflowY: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-lg shadow-indigo-500/20"
          >
            {streaming ? (
              <span className="inline-flex gap-0.5 items-center">
                <span className="w-1 h-1 rounded-full bg-white/60 bounce-dot" />
                <span className="w-1 h-1 rounded-full bg-white/60 bounce-dot" />
                <span className="w-1 h-1 rounded-full bg-white/60 bounce-dot" />
              </span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-[#3f3f46] mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
