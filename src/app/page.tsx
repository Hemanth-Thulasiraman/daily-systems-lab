import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/constants";
import { CategoryBadge, DifficultyBadge } from "@/components/CategoryBadge";
import { formatDuration } from "@/lib/utils";

async function getDashboardData() {
  const [concepts, totalFlashcards] = await Promise.all([
    prisma.concept.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
        tags: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "asc" },
    }),
    prisma.flashcard.count(),
  ]);

  const dayIndex = Math.floor(Date.now() / 86400000) % concepts.length;
  const todayConcept = concepts[dayIndex];

  const byCategory = Object.entries(CATEGORY_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    color: meta.color,
    bg: meta.bg,
    icon: meta.icon,
    count: concepts.filter((c) => c.category === key).length,
  })).filter((c) => c.count > 0);

  return { concepts, todayConcept, byCategory, totalFlashcards };
}

export default async function DashboardPage() {
  const { concepts, todayConcept, byCategory, totalFlashcards } = await getDashboardData();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Today's concept hero */}
      {todayConcept && (
        <Link href={`/concept/${todayConcept.slug}`}>
          <div className="group relative rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-6 hover:border-indigo-500/50 transition-all cursor-pointer">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                  Today&apos;s Concept
                </span>
                <span className="h-px flex-1 bg-indigo-500/20" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {todayConcept.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={todayConcept.category} />
                <DifficultyBadge difficulty={todayConcept.difficulty} />
                <span className="text-xs text-slate-500">
                  ⏱ {formatDuration(todayConcept.estimatedMinutes)}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400 font-medium">
                Start learning
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Concepts", value: concepts.length, icon: "📚" },
          { label: "Flashcards", value: totalFlashcards, icon: "🃏" },
          { label: "Categories", value: byCategory.length, icon: "🏷️" },
          { label: "Est. Hours", value: Math.round(concepts.reduce((a, c) => a + c.estimatedMinutes, 0) / 60), icon: "⏱" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {byCategory.map((cat) => (
            <div key={cat.key} className={`rounded-xl border border-slate-800 ${cat.bg} p-4`}>
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className={`text-xs font-semibold ${cat.color}`}>{cat.label}</div>
              <div className="text-slate-400 text-xs mt-1">{cat.count} concepts</div>
            </div>
          ))}
        </div>
      </div>

      {/* All concepts grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">All Concepts</h2>
        <div className="grid gap-3">
          {concepts.map((concept, i) => {
            const isToday = concept.id === todayConcept?.id;
            return (
              <Link key={concept.id} href={`/concept/${concept.slug}`}>
                <div className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-slate-600 ${
                  isToday ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                }`}>
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">{concept.title}</span>
                      {isToday && (
                        <span className="text-xs text-indigo-400 font-medium">Today</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={concept.category} />
                      <DifficultyBadge difficulty={concept.difficulty} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">{formatDuration(concept.estimatedMinutes)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
