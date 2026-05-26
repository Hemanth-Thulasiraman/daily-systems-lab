"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/constants";

interface DueCard {
  id: string;
  front: string;
  back: string;
  tag: string;
  difficulty: string;
  isNew: boolean;
  repetitions: number;
  easeFactor: number;
  interval: number;
  concept: { title: string; slug: string; category: string };
}

type Rating = "again" | "hard" | "good" | "easy";

const RATINGS: { value: Rating; label: string; color: string; key: string }[] = [
  { value: "again", label: "Again", color: "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50",   key: "1" },
  { value: "hard",  label: "Hard",  color: "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50", key: "2" },
  { value: "good",  label: "Good",  color: "bg-sky-500/10   border-sky-500/30   text-sky-300   hover:bg-sky-500/20   hover:border-sky-500/50",   key: "3" },
  { value: "easy",  label: "Easy",  color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50", key: "4" },
];

export default function ReviewPage() {
  const [cards, setCards] = useState<DueCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [totalLoaded, setTotalLoaded] = useState(0);

  useEffect(() => {
    fetch("/api/flashcards/due")
      .then((r) => r.json())
      .then((data) => {
        setCards(data.cards ?? []);
        setTotalLoaded(data.total ?? 0);
        setLoading(false);
        if (!data.cards?.length) setDone(true);
      });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " && !revealed) { e.preventDefault(); setRevealed(true); }
      if (revealed && !submitting) {
        const rating = RATINGS.find((r) => r.key === e.key);
        if (rating) handleRate(rating.value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, submitting, current]);

  const handleRate = useCallback(async (rating: Rating) => {
    if (submitting) return;
    setSubmitting(true);
    const card = cards[current];
    await fetch(`/api/flashcards/${card.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    setStats((s) => ({ ...s, [rating]: s[rating] + 1 }));
    const next = current + 1;
    if (next >= cards.length) { setDone(true); } else { setCurrent(next); setRevealed(false); }
    setSubmitting(false);
  }, [submitting, cards, current]);

  if (loading) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 bounce-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 bounce-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 bounce-dot" />
        </div>
      </div>
    );
  }

  if (done) {
    const total = stats.again + stats.hard + stats.good + stats.easy;
    const score = total > 0 ? Math.round(((stats.good + stats.easy) / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center px-6">
        <div className="max-w-sm w-full space-y-6">
          <div className="card-gradient-border p-px">
            <div className="rounded-[15px] bg-[#111113] p-8 text-center space-y-5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="text-5xl">{total === 0 ? "✨" : "🎉"}</div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">
                  {total === 0 ? "All caught up!" : "Session complete!"}
                </h1>
                {total === 0 ? (
                  <p className="text-[#71717a] text-sm">No cards due right now. Come back tomorrow!</p>
                ) : (
                  <p className="text-[#52525b] text-xs">{totalLoaded} cards reviewed</p>
                )}
              </div>
              {total > 0 && (
                <>
                  <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
                    <div className="text-4xl font-bold gradient-text-indigo mb-1">{score}%</div>
                    <div className="text-[#52525b] text-xs">recall rate</div>
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[#27272a]">
                      {RATINGS.map((r) => (
                        <div key={r.value} className="text-center">
                          <div className="text-base font-bold text-white">{stats[r.value]}</div>
                          <div className="text-[10px] text-[#52525b] capitalize">{r.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {stats.again > 0 && (
                    <p className="text-[#52525b] text-xs">
                      {stats.again} card{stats.again > 1 ? "s" : ""} will repeat tomorrow.
                    </p>
                  )}
                </>
              )}
              <div className="flex gap-2 justify-center pt-1">
                <Link href="/" className="rounded-lg border border-[#27272a] px-4 py-2 text-sm text-[#71717a] hover:text-white hover:border-[#3f3f46] transition-colors">
                  Dashboard
                </Link>
                <Link href="/" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors">
                  Learn more →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[current];
  const meta = CATEGORY_META[card.concept.category];
  const progress = (current / cards.length) * 100;

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#52525b] tabular-nums">{current + 1} / {cards.length}</span>
            {card.isNew && <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 rounded-full px-2 py-0.5">New</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 rounded-full bg-[#27272a] mb-8">
          <div className="h-0.5 rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Card */}
        <div className="card-gradient-border p-px">
          <div className="rounded-[15px] bg-[#111113] p-7 flex flex-col min-h-72">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-6">
              <span className={cn("text-[11px] font-medium", meta?.color ?? "text-[#71717a]")}>
                {meta?.icon} {meta?.label ?? card.concept.category}
              </span>
              <span className="text-[#3f3f46]">·</span>
              <Link href={`/concept/${card.concept.slug}`} className="text-[11px] text-[#52525b] hover:text-[#a1a1aa] transition-colors">
                {card.concept.title}
              </Link>
            </div>

            {/* Front */}
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-white text-lg font-medium leading-relaxed">{card.front}</p>
            </div>

            {/* Reveal / Back */}
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="mt-8 w-full rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#1c1c1f] hover:border-[#3f3f46] py-3 text-sm font-medium text-[#71717a] hover:text-white transition-all"
              >
                Reveal answer <span className="text-[#3f3f46] ml-1">[Space]</span>
              </button>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="border-t border-[#27272a] pt-5">
                  <p className="text-[#a1a1aa] leading-relaxed text-sm">{card.back}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#3f3f46] uppercase tracking-widest mb-3">How well did you know this?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => handleRate(r.value)}
                        disabled={submitting}
                        className={cn(
                          "rounded-xl border py-3 px-2 text-sm font-medium transition-all",
                          r.color,
                          submitting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div>{r.label}</div>
                        <div className="text-[10px] opacity-50 mt-0.5">[{r.key}]</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#3f3f46]">
          Space to reveal · 1–4 to rate
        </p>
      </div>
    </div>
  );
}
