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

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-6">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#71717a] hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Dashboard
        </Link>

        {/* Hero header */}
        <div className="card-gradient-border p-px">
          <div className="rounded-[15px] bg-[#111113] p-8 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${meta.color.replace("text-", "").includes("emerald") ? "rgba(52,211,153,0.1)" : meta.color.includes("sky") ? "rgba(56,189,248,0.1)" : meta.color.includes("amber") ? "rgba(251,191,36,0.1)" : meta.color.includes("purple") ? "rgba(168,85,247,0.1)" : "rgba(99,102,241,0.1)"} 0%, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <CategoryBadge category={concept.category} />
                <DifficultyBadge difficulty={concept.difficulty} />
                <span className="text-[11px] text-[#52525b] flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {formatDuration(concept.estimatedMinutes)}
                </span>
              </div>
              <h1 className={`text-4xl font-bold mb-4 ${meta.color}`}>{concept.title}</h1>
              <div className="flex flex-wrap gap-1.5">
                {concept.tags.map((tag) => (
                  <span key={tag} className="text-[11px] text-[#52525b] bg-[#18181b] border border-[#27272a] rounded-full px-2 py-0.5">#{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <Section icon="💡" title="Simple Explanation">
          <p className="text-[#a1a1aa] leading-relaxed text-[15px]">{concept.simpleExplanation}</p>
        </Section>

        <div className="grid sm:grid-cols-2 gap-6">
          <Section icon="🎯" title="Why It Matters">
            <p className="text-[#a1a1aa] leading-relaxed text-sm">{concept.whyItMatters}</p>
          </Section>
          <Section icon="⚙️" title="How It Works">
            <p className="text-[#a1a1aa] leading-relaxed text-sm whitespace-pre-line">{concept.howItWorks}</p>
          </Section>
        </div>

        <Section icon="🔬" title="Deep Dive">
          <p className="text-[#a1a1aa] leading-relaxed text-sm whitespace-pre-line">{concept.deepDive}</p>
        </Section>

        {concept.diagramCode && (
          <Section icon="🗺️" title="Architecture Diagram">
            <DiagramViewer code={concept.diagramCode} />
          </Section>
        )}

        <Section icon="🌍" title="Real-World Examples">
          <div className="grid sm:grid-cols-2 gap-3">
            {realWorldExamples.startup && (
              <div className="rounded-xl border border-[#27272a] bg-emerald-400/5 border-l-2 border-l-emerald-500 p-4">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">🚀 Startup</div>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">{realWorldExamples.startup}</p>
              </div>
            )}
            {realWorldExamples.enterprise && (
              <div className="rounded-xl border border-[#27272a] bg-blue-400/5 border-l-2 border-l-blue-500 p-4">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">🏢 Enterprise</div>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">{realWorldExamples.enterprise}</p>
              </div>
            )}
          </div>
        </Section>

        <Section icon="🛠️" title="Practical Usage">
          <p className="text-[#a1a1aa] leading-relaxed text-sm">{concept.practicalUsage}</p>
        </Section>

        {cloudUsage && (
          <Section icon="☁️" title="Cloud Usage">
            <div className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { key: "aws", label: "AWS", icon: "🟠", color: "text-amber-400" },
                  { key: "azure", label: "Azure", icon: "🔵", color: "text-sky-400" },
                  { key: "gcp", label: "GCP", icon: "🔴", color: "text-rose-400" },
                ].filter(p => cloudUsage[p.key as keyof typeof cloudUsage]).map(p => (
                  <div key={p.key} className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${p.color}`}>{p.icon} {p.label}</div>
                    <p className="text-[#71717a] text-xs leading-relaxed">{cloudUsage[p.key as keyof typeof cloudUsage]}</p>
                  </div>
                ))}
              </div>
              {cloudUsage.architecture && <InfoRow label="Architecture" value={cloudUsage.architecture} />}
              {cloudUsage.security && <InfoRow label="🔐 Security" value={cloudUsage.security} />}
              {cloudUsage.cost && <InfoRow label="💰 Cost" value={cloudUsage.cost} />}
            </div>
          </Section>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          <Section icon="⚖️" title="Common Tradeoffs">
            <ul className="space-y-2.5">
              {concept.commonTradeoffs.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#a1a1aa]">
                  <span className="mt-1 shrink-0 w-4 h-4 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <span className="text-amber-400 text-[8px]">↔</span>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Section>
          <Section icon="⚠️" title="Common Mistakes">
            <ul className="space-y-2.5">
              {concept.commonMistakes.map((m, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#a1a1aa]">
                  <span className="mt-1 shrink-0 w-4 h-4 rounded-full bg-rose-400/10 border border-rose-400/30 flex items-center justify-center">
                    <span className="text-rose-400 text-[8px]">✕</span>
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section icon="🧠" title="Scenario Questions">
          <p className="text-[11px] text-[#52525b] mb-5">Attempt each question before revealing the hint. Think out loud.</p>
          <QuestionAccordion beginner={questions.beginner} intermediate={questions.intermediate} advanced={questions.advanced} />
        </Section>

        {concept.flashcards.length > 0 && (
          <Section icon="🃏" title={`Flashcards · ${concept.flashcards.length} cards`}>
            <div className="space-y-2 mb-4">
              {concept.flashcards.map((card) => (
                <FlashPreview key={card.id} front={card.front} back={card.back} difficulty={card.difficulty} />
              ))}
            </div>
            <Link href="/review" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20">
              Review all due cards →
            </Link>
          </Section>
        )}

        {concept.relatedConcepts.length > 0 && (
          <div className="rounded-xl border border-[#27272a] bg-[#111113] p-5">
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3">Related Concepts</p>
            <div className="flex flex-wrap gap-2">
              {concept.relatedConcepts.map((s) => (
                <Link key={s} href={`/concept/${s}`} className="rounded-full border border-[#27272a] px-3 py-1 text-xs text-[#71717a] hover:text-white hover:border-[#52525b] transition-colors">
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

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#111113] p-6">
      <h2 className="flex items-center gap-2.5 text-sm font-semibold text-white mb-5">
        <span className="text-base">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
      <div className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest mb-1.5">{label}</div>
      <p className="text-sm text-[#a1a1aa] leading-relaxed">{value}</p>
    </div>
  );
}

function FlashPreview({ front, back, difficulty }: { front: string; back: string; difficulty: string }) {
  const accent: Record<string, string> = { BEGINNER: "border-l-emerald-500", INTERMEDIATE: "border-l-amber-500", ADVANCED: "border-l-rose-500" };
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
