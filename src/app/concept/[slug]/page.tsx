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

  const concept = await prisma.concept.findUnique({
    where: { slug },
    include: { flashcards: true },
  });

  if (!concept) notFound();

  const meta = CATEGORY_META[concept.category] ?? { color: "text-slate-400", icon: "📚" };
  const questions = concept.questions as { beginner: string[]; intermediate: string[]; advanced: string[] };
  const realWorldExamples = concept.realWorldExamples as { startup?: string; enterprise?: string };
  const cloudUsage = concept.cloudUsage as {
    aws?: string; azure?: string; gcp?: string;
    architecture?: string; security?: string; cost?: string;
  } | null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <CategoryBadge category={concept.category} />
          <DifficultyBadge difficulty={concept.difficulty} />
          <span className="text-xs text-slate-500">⏱ {formatDuration(concept.estimatedMinutes)}</span>
        </div>
        <h1 className={`text-3xl font-bold mb-1 ${meta.color}`}>{concept.title}</h1>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {concept.tags.map((tag) => (
            <span key={tag} className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Simple Explanation */}
      <Section title="Simple Explanation" icon="💡">
        <p className="text-slate-300 leading-relaxed">{concept.simpleExplanation}</p>
      </Section>

      {/* Why It Matters */}
      <Section title="Why It Matters" icon="🎯">
        <p className="text-slate-300 leading-relaxed">{concept.whyItMatters}</p>
      </Section>

      {/* How It Works */}
      <Section title="How It Works" icon="⚙️">
        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{concept.howItWorks}</p>
      </Section>

      {/* Deep Dive */}
      <Section title="Deep Dive" icon="🔬">
        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{concept.deepDive}</p>
      </Section>

      {/* Diagram */}
      {concept.diagramCode && (
        <Section title="Architecture Diagram" icon="🗺️">
          <DiagramViewer code={concept.diagramCode} />
        </Section>
      )}

      {/* Practical Usage */}
      <Section title="Practical Usage" icon="🛠️">
        <p className="text-slate-300 leading-relaxed">{concept.practicalUsage}</p>
      </Section>

      {/* Real World Examples */}
      <Section title="Real-World Examples" icon="🌍">
        <div className="space-y-4">
          {realWorldExamples.startup && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">🚀 Startup</div>
              <p className="text-slate-300 text-sm leading-relaxed">{realWorldExamples.startup}</p>
            </div>
          )}
          {realWorldExamples.enterprise && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">🏢 Enterprise</div>
              <p className="text-slate-300 text-sm leading-relaxed">{realWorldExamples.enterprise}</p>
            </div>
          )}
        </div>
      </Section>

      {/* Cloud Usage */}
      {cloudUsage && (
        <Section title="Cloud Architecture Usage" icon="☁️">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              {cloudUsage.aws && <CloudCard provider="AWS" icon="🟠" content={cloudUsage.aws} />}
              {cloudUsage.azure && <CloudCard provider="Azure" icon="🔵" content={cloudUsage.azure} />}
              {cloudUsage.gcp && <CloudCard provider="GCP" icon="🔴" content={cloudUsage.gcp} />}
            </div>
            {cloudUsage.architecture && (
              <InfoBlock label="Architecture" content={cloudUsage.architecture} />
            )}
            {cloudUsage.security && (
              <InfoBlock label="🔐 Security" content={cloudUsage.security} />
            )}
            {cloudUsage.cost && (
              <InfoBlock label="💰 Cost" content={cloudUsage.cost} />
            )}
          </div>
        </Section>
      )}

      {/* Tradeoffs */}
      <Section title="Common Tradeoffs" icon="⚖️">
        <ul className="space-y-2">
          {concept.commonTradeoffs.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-amber-400 mt-0.5 shrink-0">↔</span>
              {t}
            </li>
          ))}
        </ul>
      </Section>

      {/* Mistakes */}
      <Section title="Common Mistakes" icon="⚠️">
        <ul className="space-y-2">
          {concept.commonMistakes.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-red-400 mt-0.5 shrink-0">✗</span>
              {m}
            </li>
          ))}
        </ul>
      </Section>

      {/* Scenario Questions */}
      <Section title="Scenario Questions" icon="🧠">
        <p className="text-xs text-slate-500 mb-4">
          These questions test real-world understanding. Attempt each before revealing hints.
        </p>
        <QuestionAccordion
          beginner={questions.beginner}
          intermediate={questions.intermediate}
          advanced={questions.advanced}
        />
      </Section>

      {/* Flashcards preview */}
      {concept.flashcards.length > 0 && (
        <Section title={`Flashcards (${concept.flashcards.length})`} icon="🃏">
          <div className="space-y-3">
            {concept.flashcards.map((card) => (
              <FlashPreview key={card.id} front={card.front} back={card.back} difficulty={card.difficulty} />
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Review All Due Cards →
            </Link>
          </div>
        </Section>
      )}

      {/* Navigation */}
      {concept.relatedConcepts.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Related Concepts</p>
          <div className="flex flex-wrap gap-2">
            {concept.relatedConcepts.map((slug) => (
              <Link
                key={slug}
                href={`/concept/${slug}`}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function CloudCard({ provider, icon, content }: { provider: string; icon: string; content: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
      <div className="text-xs font-semibold text-slate-400 mb-1.5">{icon} {provider}</div>
      <p className="text-xs text-slate-300 leading-relaxed">{content}</p>
    </div>
  );
}

function InfoBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="text-xs font-semibold text-slate-400 mb-1.5">{label}</div>
      <p className="text-sm text-slate-300 leading-relaxed">{content}</p>
    </div>
  );
}

function FlashPreview({ front, back, difficulty }: { front: string; back: string; difficulty: string }) {
  const colors: Record<string, string> = {
    BEGINNER: "border-emerald-500/30",
    INTERMEDIATE: "border-amber-500/30",
    ADVANCED: "border-red-500/30",
  };
  return (
    <details className={`rounded-lg border ${colors[difficulty] ?? "border-slate-700"} bg-slate-900`}>
      <summary className="cursor-pointer p-3 text-sm text-slate-300 select-none hover:text-white">
        {front}
      </summary>
      <div className="px-3 pb-3 pt-1 border-t border-slate-700">
        <p className="text-sm text-slate-400">{back}</p>
      </div>
    </details>
  );
}
