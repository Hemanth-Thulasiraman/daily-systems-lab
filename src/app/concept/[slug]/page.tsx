export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/constants";
import { CategoryBadge, DifficultyBadge } from "@/components/CategoryBadge";
import { QuestionAccordion } from "@/components/QuestionAccordion";
import { DiagramViewer } from "@/components/DiagramViewer";
import { formatDuration } from "@/lib/utils";

export default async function ConceptPage(props: PageProps<"/concept/[slug]">) {
  const { slug } = await props.params;
  const concept = await prisma.concept.findUnique({ where: { slug }, include: { flashcards: true } });
  if (!concept) notFound();

  const meta = CATEGORY_META[concept.category] ?? { color: "text-zinc-400", icon: "📚", bg: "bg-zinc-400/10", label: concept.category };
  const questions = concept.questions as { beginner: string[]; intermediate: string[]; advanced: string[] };
  const realWorldExamples = concept.realWorldExamples as { startup?: string; enterprise?: string };
  const cloudUsage = concept.cloudUsage as { aws?: string; azure?: string; gcp?: string; architecture?: string; security?: string; cost?: string } | null;

  // Review schedule
  const today = new Date();
  const reviewDays = [
    { label: "Today", days: 0, icon: "📖" },
    { label: "+1 day",  days: 1,  icon: "🔄" },
    { label: "+3 days", days: 3,  icon: "🔄" },
    { label: "+7 days", days: 7,  icon: "🔄" },
    { label: "+14 days", days: 14, icon: "🔄" },
    { label: "+30 days", days: 30, icon: "🔄" },
  ].map(({ label, days, icon }) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return {
      label,
      icon,
      days,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  // Section counter
  let sectionNum = 0;
  const nextNum = () => String(++sectionNum).padStart(2, "0");

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-5">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Dashboard
        </Link>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="card-gradient-border p-px">
          <div className="rounded-[15px] bg-[#111113] p-8 relative overflow-hidden">
            <div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-60"
              style={{ background: `radial-gradient(circle, ${glowColor(meta.color)} 0%, transparent 70%)` }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <CategoryBadge category={concept.category} />
                <DifficultyBadge difficulty={concept.difficulty} />
                <span className="text-[11px] text-[#52525b] flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {formatDuration(concept.estimatedMinutes)}
                </span>
                <span className="text-[11px] text-[#52525b]">· 12 sections</span>
              </div>
              <h1 className={`text-4xl font-bold mb-3 ${meta.color}`}>{concept.title}</h1>
              <p className="text-[#52525b] text-sm mb-4">Daily lesson · Production-focused engineering</p>
              <div className="flex flex-wrap gap-1.5">
                {concept.tags.map((tag) => (
                  <span key={tag} className="text-[11px] text-[#52525b] bg-[#18181b] border border-[#27272a] rounded-full px-2 py-0.5">#{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 01 Simple Explanation ───────────────────────────────────── */}
        <Lesson num={nextNum()} icon="💡" title="Simple Explanation" accent="indigo">
          <p className="text-[#a1a1aa] leading-relaxed text-[15px]">{concept.simpleExplanation}</p>
        </Lesson>

        {/* ── 02 Why It Matters ───────────────────────────────────────── */}
        <Lesson num={nextNum()} icon="🎯" title="Why It Matters" accent="violet">
          <p className="text-[#a1a1aa] leading-relaxed text-sm">{concept.whyItMatters}</p>
        </Lesson>

        {/* ── 03 How It Works ─────────────────────────────────────────── */}
        <Lesson num={nextNum()} icon="⚙️" title="How It Works" accent="sky">
          <p className="text-[#a1a1aa] leading-relaxed text-sm whitespace-pre-line">{concept.howItWorks}</p>
          {concept.deepDive && (
            <details className="mt-5 rounded-xl border border-[#27272a] bg-[#18181b] group">
              <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 select-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 group-open:rotate-90 transition-transform text-[#3f3f46]">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span className="text-[11px] font-semibold text-[#52525b] uppercase tracking-widest hover:text-[#a1a1aa] transition-colors">
                  Technical Deep Dive
                </span>
              </summary>
              <div className="px-4 pb-5 pt-3 border-t border-[#27272a]">
                <p className="text-[#71717a] text-sm leading-relaxed whitespace-pre-line">{concept.deepDive}</p>
              </div>
            </details>
          )}
        </Lesson>

        {/* ── 04 Real-World Examples ──────────────────────────────────── */}
        {(realWorldExamples.startup || realWorldExamples.enterprise) && (
          <Lesson num={nextNum()} icon="🌍" title="Real-World Examples" accent="emerald">
            <div className="grid sm:grid-cols-2 gap-3">
              {realWorldExamples.startup && (
                <div className="rounded-xl border border-[#27272a] border-l-2 border-l-emerald-500 bg-emerald-400/5 p-4">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">🚀 Startup</div>
                  <p className="text-[#a1a1aa] text-sm leading-relaxed">{realWorldExamples.startup}</p>
                </div>
              )}
              {realWorldExamples.enterprise && (
                <div className="rounded-xl border border-[#27272a] border-l-2 border-l-sky-500 bg-sky-400/5 p-4">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">🏢 Enterprise</div>
                  <p className="text-[#a1a1aa] text-sm leading-relaxed">{realWorldExamples.enterprise}</p>
                </div>
              )}
            </div>
          </Lesson>
        )}

        {/* ── 05 Product Use Case ─────────────────────────────────────── */}
        <Lesson num={nextNum()} icon="🛠️" title="Product Use Case" accent="amber">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm">💼</span>
              </div>
              <p className="text-[#a1a1aa] leading-relaxed text-sm">{concept.practicalUsage}</p>
            </div>
          </div>
        </Lesson>

        {/* ── 06 Where It Fits in Production ─────────────────────────── */}
        {cloudUsage && (
          <Lesson num={nextNum()} icon="☁️" title="Where It Fits in Production" accent="sky">
            <div className="space-y-3">
              {/* Cloud providers */}
              <div className="grid sm:grid-cols-3 gap-3">
                {([
                  { key: "aws",   label: "AWS",   icon: "🟠", color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-400/5" },
                  { key: "azure", label: "Azure", icon: "🔵", color: "text-sky-400",   border: "border-sky-500/20",   bg: "bg-sky-400/5"   },
                  { key: "gcp",   label: "GCP",   icon: "🔴", color: "text-rose-400",  border: "border-rose-500/20",  bg: "bg-rose-400/5"  },
                ] as const).filter(p => cloudUsage[p.key]).map(p => (
                  <div key={p.key} className={`rounded-xl border ${p.border} ${p.bg} p-4`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${p.color}`}>{p.icon} {p.label}</div>
                    <p className="text-[#71717a] text-xs leading-relaxed">{cloudUsage[p.key]}</p>
                  </div>
                ))}
              </div>

              {/* Architecture flow */}
              {cloudUsage.architecture && (
                <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">🗺 Architecture Flow</div>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed font-mono text-[12px]">{cloudUsage.architecture}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {cloudUsage.security && (
                  <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">🔐 Security</div>
                    <p className="text-xs text-[#71717a] leading-relaxed">{cloudUsage.security}</p>
                  </div>
                )}
                {cloudUsage.cost && (
                  <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">💰 Cost</div>
                    <p className="text-xs text-[#71717a] leading-relaxed">{cloudUsage.cost}</p>
                  </div>
                )}
              </div>
            </div>
          </Lesson>
        )}

        {/* ── 07 Architecture Diagram ─────────────────────────────────── */}
        {concept.diagramCode && (
          <Lesson num={nextNum()} icon="🗺️" title="Architecture Diagram" accent="indigo">
            <DiagramViewer code={concept.diagramCode} />
          </Lesson>
        )}

        {/* ── 08 Common Mistakes ──────────────────────────────────────── */}
        <Lesson num={nextNum()} icon="⚠️" title="Common Mistakes" accent="rose">
          <ul className="space-y-3">
            {concept.commonMistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-400/10 border border-rose-400/30 flex items-center justify-center">
                  <span className="text-rose-400 text-[9px] font-bold">✕</span>
                </span>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{m}</p>
              </li>
            ))}
          </ul>
        </Lesson>

        {/* ── 09 Tradeoffs ────────────────────────────────────────────── */}
        <Lesson num={nextNum()} icon="⚖️" title="Tradeoffs" accent="amber">
          <ul className="space-y-3">
            {concept.commonTradeoffs.map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                  <span className="text-amber-400 text-[9px] font-bold">↔</span>
                </span>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{t}</p>
              </li>
            ))}
          </ul>
        </Lesson>

        {/* ── 10 Scenario Questions ───────────────────────────────────── */}
        <Lesson num={nextNum()} icon="🧠" title="Scenario Questions" accent="violet">
          <p className="text-[11px] text-[#52525b] mb-5 leading-relaxed">
            Each question is based on a realistic engineering situation. Attempt it before revealing the hint — thinking out loud counts.
          </p>
          <QuestionAccordion
            beginner={questions.beginner}
            intermediate={questions.intermediate}
            advanced={questions.advanced}
          />
        </Lesson>

        {/* ── 11 Flashcards ───────────────────────────────────────────── */}
        {concept.flashcards.length > 0 && (
          <Lesson num={nextNum()} icon="🃏" title={`Flashcards · ${concept.flashcards.length} cards`} accent="indigo">
            <div className="space-y-2 mb-5">
              {concept.flashcards.map((card) => (
                <FlashPreview key={card.id} front={card.front} back={card.back} difficulty={card.difficulty} />
              ))}
            </div>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Review all due cards
            </Link>
          </Lesson>
        )}

        {/* ── 12 Review Schedule ──────────────────────────────────────── */}
        <Lesson num={nextNum()} icon="📅" title="Review Schedule" accent="emerald">
          <p className="text-[11px] text-[#52525b] mb-5 leading-relaxed">
            Spaced repetition (SM-2). Review flashcards at each interval to move concepts into long-term memory.
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {reviewDays.map((r, i) => (
              <div
                key={i}
                className={`shrink-0 rounded-xl border px-4 py-3 text-center min-w-[88px] transition-colors ${
                  i === 0
                    ? "border-indigo-500/40 bg-indigo-500/10"
                    : "border-[#27272a] bg-[#18181b]"
                }`}
              >
                <div className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${i === 0 ? "text-indigo-400" : "text-[#52525b]"}`}>
                  {r.label}
                </div>
                <div className={`text-sm font-bold ${i === 0 ? "text-white" : "text-[#71717a]"}`}>{r.date}</div>
                {i === 0 && (
                  <div className="flex justify-center mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#3f3f46] mt-4">
            Intervals follow the SM-2 algorithm. Rating cards as "Easy" extends the interval; "Again" resets it.
          </p>
        </Lesson>

        {/* ── Related Concepts ────────────────────────────────────────── */}
        {concept.relatedConcepts.length > 0 && (
          <div className="rounded-xl border border-[#27272a] bg-[#111113] p-5">
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3">Continue Learning</p>
            <div className="flex flex-wrap gap-2">
              {concept.relatedConcepts.map((s) => (
                <Link
                  key={s}
                  href={`/concept/${s}`}
                  className="rounded-full border border-[#27272a] px-3 py-1 text-xs text-[#71717a] hover:text-white hover:border-[#52525b] transition-colors"
                >
                  {s.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACCENTS: Record<string, { header: string; num: string }> = {
  indigo:  { header: "border-indigo-500/20  bg-indigo-500/5",   num: "text-indigo-400"  },
  violet:  { header: "border-violet-500/20  bg-violet-500/5",   num: "text-violet-400"  },
  sky:     { header: "border-sky-500/20     bg-sky-500/5",      num: "text-sky-400"     },
  emerald: { header: "border-emerald-500/20 bg-emerald-500/5",  num: "text-emerald-400" },
  amber:   { header: "border-amber-500/20   bg-amber-500/5",    num: "text-amber-400"   },
  rose:    { header: "border-rose-500/20    bg-rose-500/5",     num: "text-rose-400"    },
  zinc:    { header: "border-[#27272a]      bg-transparent",    num: "text-[#52525b]"   },
};

function Lesson({
  num,
  icon,
  title,
  accent = "zinc",
  children,
}: {
  num: string;
  icon: string;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  const a = ACCENTS[accent] ?? ACCENTS.zinc;
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#111113] overflow-hidden">
      {/* Section header */}
      <div className={`flex items-center gap-3 px-6 py-3.5 border-b border-[#1c1c1e] ${a.header}`}>
        <span className={`text-[11px] font-bold font-mono tracking-widest ${a.num}`}>{num}</span>
        <span className="w-px h-4 bg-[#27272a] shrink-0" />
        <span className="text-sm">{icon}</span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FlashPreview({ front, back, difficulty }: { front: string; back: string; difficulty: string }) {
  const accent: Record<string, string> = {
    BEGINNER:     "border-l-emerald-500",
    INTERMEDIATE: "border-l-amber-500",
    ADVANCED:     "border-l-rose-500",
  };
  return (
    <details className={`rounded-xl border border-[#27272a] border-l-2 ${accent[difficulty] ?? "border-l-zinc-600"} bg-[#18181b] group`}>
      <summary className="cursor-pointer px-4 py-3 text-sm text-[#a1a1aa] select-none hover:text-white transition-colors flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 group-open:rotate-90 transition-transform text-[#52525b]">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        {front}
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-[#27272a]">
        <p className="text-sm text-[#71717a] leading-relaxed">{back}</p>
      </div>
    </details>
  );
}

function glowColor(colorClass: string): string {
  if (colorClass.includes("emerald")) return "rgba(52,211,153,0.12)";
  if (colorClass.includes("sky"))     return "rgba(56,189,248,0.12)";
  if (colorClass.includes("amber"))   return "rgba(251,191,36,0.12)";
  if (colorClass.includes("violet") || colorClass.includes("purple")) return "rgba(168,85,247,0.12)";
  if (colorClass.includes("rose"))    return "rgba(251,113,133,0.12)";
  return "rgba(99,102,241,0.12)";
}
