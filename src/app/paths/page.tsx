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
      select: {
        slug: true,
        title: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
      },
    }),
  ]);

  const conceptMap = Object.fromEntries(concepts.map((c) => [c.slug, c]));
  return { paths, conceptMap };
}

export default async function PathsPage() {
  const { paths, conceptMap } = await getPathsData();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Learning Paths</h1>
        <p className="text-slate-400 text-sm mt-1">
          Structured sequences to take you from zero to production-ready on each topic.
        </p>
      </div>

      <div className="grid gap-6">
        {paths.map((path) => {
          const meta = CATEGORY_META[path.category] ?? { color: "text-slate-400", bg: "bg-slate-400/10", icon: "📚", label: path.category };
          const pathConcepts = path.conceptSlugs
            .map((s) => conceptMap[s])
            .filter(Boolean);

          return (
            <div
              key={path.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden"
            >
              {/* Path header */}
              <div className={`p-6 border-b border-slate-800 ${meta.bg}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{path.icon ?? meta.icon}</span>
                      <CategoryBadge category={path.category} />
                    </div>
                    <h2 className={`text-xl font-bold ${meta.color}`}>{path.title}</h2>
                    <p className="text-slate-400 text-sm mt-1 max-w-xl">{path.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-white">{path.totalConcepts}</div>
                    <div className="text-xs text-slate-500">concepts</div>
                    <div className="text-sm text-slate-400 mt-1">~{path.estimatedHours}h</div>
                  </div>
                </div>
              </div>

              {/* Concept list */}
              <div className="p-4 space-y-2">
                {pathConcepts.map((concept, i) => (
                  <Link key={concept.slug} href={`/concept/${concept.slug}`}>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors group">
                      <div className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 transition-colors">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                          {concept.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <DifficultyBadge difficulty={concept.difficulty} />
                        <span className="text-xs text-slate-600">
                          {formatDuration(concept.estimatedMinutes)}
                        </span>
                        <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-sm">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Start button */}
              {pathConcepts[0] && (
                <div className="px-6 pb-5">
                  <Link
                    href={`/concept/${pathConcepts[0].slug}`}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${meta.bg} ${meta.color} hover:opacity-80 border border-current/20`}
                  >
                    Start path →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All concepts callout */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Browse all concepts</h3>
          <p className="text-sm text-slate-400">15 concepts across 8 categories — study in any order.</p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
        >
          Dashboard →
        </Link>
      </div>
    </div>
  );
}
