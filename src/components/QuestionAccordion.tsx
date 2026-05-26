"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  answer?: string;
}

interface Props {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
}

function QuestionItem({ q, index }: { q: string; index: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xs font-bold text-slate-500 shrink-0">Q{index + 1}</span>
        <p className="text-sm text-slate-200 leading-relaxed">{q}</p>
      </div>
      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 ml-6 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
        >
          Attempt first, then reveal hint →
        </button>
      )}
      {revealed && (
        <div className="mt-3 ml-6 rounded-md bg-slate-800 border border-slate-600 px-3 py-2">
          <p className="text-xs text-slate-400">
            Think about: edge cases, scale, failure modes, and tradeoffs. There is no single right answer —
            articulate your assumptions and reasoning clearly.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, questions }: { title: string; color: string; questions: string[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        <span className={cn("text-xs font-semibold uppercase tracking-widest", color)}>{title}</span>
        <span className="text-slate-600 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionItem key={i} q={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestionAccordion({ beginner, intermediate, advanced }: Props) {
  return (
    <div className="space-y-6">
      <Section title="Beginner" color="text-emerald-400" questions={beginner} />
      <Section title="Intermediate" color="text-amber-400" questions={intermediate} />
      <Section title="Advanced" color="text-red-400" questions={advanced} />
    </div>
  );
}
