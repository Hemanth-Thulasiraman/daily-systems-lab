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
  { value: "again", label: "Again", color: "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30", key: "1" },
  { value: "hard",  label: "Hard",  color: "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30", key: "2" },
  { value: "good",  label: "Good",  color: "bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30", key: "3" },
  { value: "easy",  label: "Easy",  color: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30", key: "4" },
];

function intervalLabel(interval: number, rating: Rating): string {
  if (rating === "again") return "< 1 day";
  if (interval === 1) return "1 day";
  if (interval < 7) return `${interval} days`;
  if (interval < 30) return `${Math.round(interval / 7)}w`;
  return `${Math.round(interval / 30)}mo`;
}

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

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " && !revealed) {
        e.preventDefault();
        setRevealed(true);
      }
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
    if (next >= cards.length) {
      setDone(true);
    } else {
      setCurrent(next);
      setRevealed(false);
    }
    setSubmitting(false);
  }, [submitting, cards, current]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400 text-sm">Loading cards…</div>
      </div>
    );
  }

  if (done) {
    const total = stats.again + stats.hard + stats.good + stats.easy;
    const score = total > 0 ? Math.round(((stats.good + stats.easy) / total) * 100) : 0;
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold text-white">
            {total === 0 ? "All caught up!" : "Session complete!"}
          </h1>
          {total === 0 ? (
            <p className="text-slate-400">No cards are due right now. Come back tomorrow!</p>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4">
                <div className="text-4xl font-bold text-white">{score}%</div>
                <div className="text-slate-400 text-sm">recall rate this session</div>
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {RATINGS.map((r) => (
                    <div key={r.value} className="text-center">
                      <div className="text-lg font-bold text-white">{stats[r.value]}</div>
                      <div className="text-xs text-slate-500 capitalize">{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                {stats.again > 0
                  ? `${stats.again} card${stats.again > 1 ? "s" : ""} will be shown again tomorrow.`
                  : "All cards scheduled for future review."}
              </p>
            </>
          )}
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              Dashboard
            </Link>
            {total === 0 && (
              <Link
                href="/concept/load-balancing"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                Learn a concept →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const card = cards[current];
  const meta = CATEGORY_META[card.concept.category];
  const progress = ((current) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          ← Back
        </Link>
        <div className="text-sm text-slate-500">
          {current + 1} / {cards.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-slate-800 mb-8">
        <div
          className="h-1 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 min-h-64 p-8 flex flex-col">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-6">
          <span className={cn("text-xs font-medium", meta?.color ?? "text-slate-400")}>
            {meta?.icon} {meta?.label ?? card.concept.category}
          </span>
          <span className="text-slate-700">·</span>
          <Link
            href={`/concept/${card.concept.slug}`}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {card.concept.title}
          </Link>
          {card.isNew && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-indigo-400">New</span>
            </>
          )}
        </div>

        {/* Front */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-white text-lg font-medium leading-relaxed">{card.front}</p>
        </div>

        {/* Reveal / Back */}
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-8 w-full rounded-xl border border-slate-600 bg-slate-800 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Reveal answer <span className="text-slate-600 ml-1">[Space]</span>
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="border-t border-slate-700 pt-4">
              <p className="text-slate-300 leading-relaxed">{card.back}</p>
            </div>

            {/* Rating buttons */}
            <div className="pt-2">
              <p className="text-xs text-slate-600 mb-3">How well did you know this?</p>
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
                    <div className="text-xs opacity-60 mt-0.5">[{r.key}]</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="mt-4 text-center text-xs text-slate-700">
        Space to reveal · 1–4 to rate
      </p>
    </div>
  );
}
