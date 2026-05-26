export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/constants";
import { CategoryBadge, DifficultyBadge } from "@/components/CategoryBadge";
import { formatDuration } from "@/lib/utils";

async function getPathsData() {
  const [paths, concepts] = await Promise.all([
    prisma.learningPath.findMany({ orderBy: { title: "asc" } }),
    prisma.concept.findMany({
      select: { slug: true, title: true, category: true, difficulty: true, estimatedMinutes: true },
    }),
  ]);
  const conceptMap = Object.fromEntries(concepts.map((c) => [c.slug, c]));
  return { paths, conceptMap };
}

export default async function PathsPage() {
  const { paths, conceptMap } = await getPathsData();

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold gradient-text">Learning Paths</h1>
          <p className="text-[#52525b] text-sm mt-1">
            Structured sequences to take you from zero to production-ready.
          </p>
        </div>

        {/* Path cards */}
        <div className="space-y-5">
          {paths.map((path) => {
            const meta = CATEGORY_META[path.category] ?? { color: "text-[#71717a]", bg: "bg-[#18181b]", icon: "📚", label: path.category };
            const pathConcepts = path.conceptSlugs.map((s) => conceptMap[s]).filter(Boolean);

            return (
              <div key={path.id} className="rounded-xl border border-[#27272a] bg-[#111113] overflow-hidden">
                {/* Path header */}
                <div className={`p-6 border-b border-[#27272a] ${meta.bg}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="text-2xl">{path.icon ?? meta.icon}</span>
                        <CategoryBadge category={path.category} />
                      </div>
                      <h2 className={`text-lg font-bold mb-1 ${meta.color}`}>{path.title}</h2>
                      <p className="text-[#71717a] text-sm max-w-xl leading-relaxed">{path.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-3xl font-bold ${meta.color}`}>{path.totalConcepts}</div>
                      <div className="text-[10px] text-[#52525b] uppercase tracking-widest mt-0.5">concepts</div>
                      <div className="text-sm text-[#71717a] mt-1.5">~{path.estimatedHours}h</div>
                    </div>
                  </div>
                </div>

                {/* Concept list */}
                <div className="p-3 divide-y divide-[#1c1c1e]">
                  {pathConcepts.map((concept, i) => (
                    <Link key={concept.slug} href={`/concept/${concept.slug}`}>
                      <div className="flex items-center gap-3 px-3 py-3 hover:bg-[#18181b] rounded-lg transition-colors group">
                        <div className="w-5 h-5 rounded-full bg-[#27272a] flex items-center justify-center text-[10px] font-bold text-[#52525b] shrink-0 group-hover:bg-[#3f3f46] transition-colors tabular-nums">
                          {i + 1}
                        </div>
                        <span className="text-base shrink-0">{CATEGORY_META[concept.category]?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-[#e4e4e7] group-hover:text-white transition-colors">
                            {concept.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <DifficultyBadge difficulty={concept.difficulty} />
                          <span className="text-[11px] text-[#52525b] w-8 text-right">{formatDuration(concept.estimatedMinutes)}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3f3f46] group-hover:text-[#71717a] transition-colors">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Start button */}
                {pathConcepts[0] && (
                  <div className="px-6 pb-5 pt-1">
                    <Link
                      href={`/concept/${pathConcepts[0].slug}`}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all border",
                        meta.bg, meta.color, "border-current/20 hover:opacity-80"
                      )}
                    >
                      Start path
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* All concepts callout */}
        <div className="rounded-xl border border-[#27272a] bg-[#111113] p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Browse all concepts</h3>
            <p className="text-sm text-[#52525b]">26 concepts across 8 categories — study in any order.</p>
          </div>
          <Link href="/" className="shrink-0 rounded-lg border border-[#27272a] px-4 py-2 text-sm text-[#71717a] hover:border-[#3f3f46] hover:text-white transition-colors">
            Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
