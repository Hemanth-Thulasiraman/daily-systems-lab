"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
}

function QuestionItem({ q, index }: { q: string; index: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[10px] font-bold text-[#3f3f46] shrink-0 tabular-nums">Q{index + 1}</span>
        <p className="text-sm text-[#e4e4e7] leading-relaxed">{q}</p>
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 ml-7 text-xs text-[#52525b] hover:text-indigo-400 transition-colors"
        >
          Attempt first, then reveal hint →
        </button>
      ) : (
        <div className="mt-3 ml-7 rounded-lg border border-[#27272a] bg-[#111113] px-3 py-2.5">
          <p className="text-xs text-[#71717a] leading-relaxed">
            Think about: edge cases, scale, failure modes, and tradeoffs. There is no single right answer —
            articulate your assumptions and reasoning clearly.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, accent, dotColor, questions }: { title: string; accent: string; dotColor: string; questions: string[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 w-full text-left mb-3 group">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
        <span className={cn("text-[11px] font-semibold uppercase tracking-widest", accent)}>{title}</span>
        <span className="text-[#3f3f46] text-[10px] ml-auto group-hover:text-[#52525b] transition-colors">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div className="space-y-2.5">
          {questions.map((q, i) => <QuestionItem key={i} q={q} index={i} />)}
        </div>
      )}
    </div>
  );
}

export function QuestionAccordion({ beginner, intermediate, advanced }: Props) {
  return (
    <div className="space-y-6">
      <Section title="Beginner"     accent="text-emerald-400" dotColor="bg-emerald-400" questions={beginner} />
      <Section title="Intermediate" accent="text-amber-400"   dotColor="bg-amber-400"   questions={intermediate} />
      <Section title="Advanced"     accent="text-rose-400"    dotColor="bg-rose-400"     questions={advanced} />
    </div>
  );
}
