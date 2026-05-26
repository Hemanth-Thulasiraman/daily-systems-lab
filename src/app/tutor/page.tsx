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
  // Very simple inline renderer: bold, code, line breaks
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h3 key={i} className="text-base font-bold text-white mt-2">{line.slice(2)}</h3>;
        if (line.startsWith("## ")) return <h4 key={i} className="text-sm font-semibold text-white mt-2">{line.slice(3)}</h4>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5 shrink-0">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          const [num, ...rest] = line.split(". ");
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0 font-mono text-xs mt-0.5">{num}.</span>
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
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="text-amber-300 bg-slate-800 rounded px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
    }
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

  // Load concepts list
  useEffect(() => {
    fetch("/api/concepts/list")
      .then((r) => r.json())
      .then((d) => setConcepts(d.concepts ?? []));
  }, []);

  // Load chat history when concept changes
  useEffect(() => {
    setLoadingHistory(true);
    const url = selectedConcept
      ? `/api/chat?conceptId=${selectedConcept.id}`
      : "/api/chat";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setLoadingHistory(false);
      });
  }, [selectedConcept]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setStreaming(true);

    // Placeholder for streaming assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conceptId: selectedConcept?.id,
        }),
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
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: snap };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Check that your ANTHROPIC_API_KEY is set in .env.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, streaming, selectedConcept]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmpty = messages.length === 0 && !loadingHistory;

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950 shrink-0">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors shrink-0">
          ←
        </Link>
        <div className="text-sm font-semibold text-white">AI Tutor</div>
        <div className="flex-1" />
        {/* Concept selector */}
        <select
          value={selectedConcept?.id ?? ""}
          onChange={(e) => {
            const c = concepts.find((c) => c.id === e.target.value) ?? null;
            setSelectedConcept(c);
          }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-48"
        >
          <option value="">General (no context)</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>
              {CATEGORY_META[c.category]?.icon} {c.title}
            </option>
          ))}
        </select>
        {selectedConcept && (
          <Link
            href={`/concept/${selectedConcept.slug}`}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
          >
            View concept →
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {isEmpty && (
          <div className="max-w-xl mx-auto text-center space-y-6 pt-12">
            <div className="text-4xl">🤖</div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">AI Tutor</h2>
              <p className="text-sm text-slate-400">
                Ask me anything about {selectedConcept ? (
                  <span className="text-indigo-400">{selectedConcept.title}</span>
                ) : "system design, cloud, DevOps, or AI/ML"}.
                {" "}I&apos;ll use the Socratic method — expect questions back!
              </p>
            </div>
            {selectedConcept && (
              <div className="grid grid-cols-1 gap-2 text-left">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 hover:border-indigo-500/50 hover:text-white hover:bg-slate-800 transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loadingHistory && (
          <div className="text-center text-sm text-slate-600">Loading history…</div>
        )}

        <div className="max-w-2xl mx-auto space-y-6 w-full">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5",
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300"
              )}>
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div className={cn(
                "flex-1 min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-indigo-600 text-white max-w-lg ml-auto"
                  : "bg-slate-900 border border-slate-800 text-slate-300"
              )}>
                {msg.role === "assistant" ? (
                  msg.content ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce delay-0 text-slate-600">●</span>
                      <span className="animate-bounce delay-100 text-slate-600">●</span>
                      <span className="animate-bounce delay-200 text-slate-600">●</span>
                    </span>
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              selectedConcept
                ? `Ask about ${selectedConcept.title}…`
                : "Ask any engineering question…"
            }
            rows={1}
            disabled={streaming}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50 transition-colors"
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
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {streaming ? "…" : "Send"}
          </button>
        </div>
        <p className="text-center text-xs text-slate-700 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
