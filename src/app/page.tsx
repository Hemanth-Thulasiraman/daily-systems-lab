export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/constants";
import { CategoryBadge, DifficultyBadge } from "@/components/CategoryBadge";
import { formatDuration } from "@/lib/utils";

async function getDashboardData() {
  const [concepts, totalFlashcards] = await Promise.all([
    prisma.concept.findMany({
      select: { id: true, slug: true, title: true, category: true, difficulty: true, estimatedMinutes: true, publishedAt: true },
      orderBy: { publishedAt: "asc" },
    }),
    prisma.flashcard.count(),
  ]);
  const dayIndex = Math.floor(Date.now() / 86400000) % concepts.length;
  const todayConcept = concepts[dayIndex];
  const byCategory = Object.entries(CATEGORY_META)
    .map(([key, meta]) => ({ key, ...meta, count: concepts.filter((c) => c.category === key).length }))
    .filter((c) => c.count > 0);
  return { concepts, todayConcept, byCategory, totalFlashcards };
}

export default async function DashboardPage() {
  const { concepts, todayConcept, byCategory, totalFlashcards } = await getDashboardData();
  const totalHours = Math.round(concepts.reduce((a, c) => a + c.estimatedMinutes, 0) / 60);

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
            <p className="text-[#52525b] text-sm mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link href="/review" className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20">
            Review Cards
            <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs font-bold">{totalFlashcards}</span>
          </Link>
        </div>

        {/* Today's Concept — Hero */}
        {todayConcept && (
          <Link href={`/concept/${todayConcept.slug}`}>
            <div className="card-gradient-border group cursor-pointer p-px">
              <div className="rounded-[15px] bg-[#111113] p-8 relative overflow-hidden transition-all duration-200 hover:bg-[#141416]">
                {/* Background glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      Today&apos;s Concept
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-200">
                    {todayConcept.title}
                  </h2>

                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    <CategoryBadge category={todayConcept.category} />
                    <DifficultyBadge difficulty={todayConcept.difficulty} />
                    <span className="text-[11px] text-[#52525b] flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {formatDuration(todayConcept.estimatedMinutes)}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    Start learning
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-200">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Concepts", value: concepts.length, color: "text-indigo-400", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
            { label: "Flashcards", value: totalFlashcards, color: "text-violet-400", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
            { label: "Categories", value: byCategory.length, color: "text-sky-400", icon: "M4 6h16M4 12h16M4 18h16" },
            { label: "Hours", value: totalHours, color: "text-emerald-400", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 5v5l4 2-4-2V7z" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#27272a] bg-[#111113] p-5 hover:border-[#3f3f46] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${s.color} mb-3`}>
                <path d={s.icon} />
              </svg>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-[#52525b] mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#52525b] uppercase tracking-widest mb-4">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {byCategory.map((cat) => (
              <div key={cat.key} className={`rounded-xl border border-[#27272a] ${cat.bg} p-4 hover:border-[#3f3f46] transition-colors`}>
                <div className="text-xl mb-2">{cat.icon}</div>
                <div className={`text-xs font-semibold ${cat.color}`}>{cat.label}</div>
                <div className="text-[#52525b] text-[11px] mt-1">{cat.count} concepts</div>
              </div>
            ))}
          </div>
        </div>

        {/* Concept list */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#52525b] uppercase tracking-widest mb-4">All Concepts</h2>
          <div className="rounded-xl border border-[#27272a] bg-[#111113] overflow-hidden divide-y divide-[#1c1c1e]">
            {concepts.map((concept, i) => {
              const isToday = concept.id === todayConcept?.id;
              const meta = CATEGORY_META[concept.category];
              return (
                <Link key={concept.id} href={`/concept/${concept.slug}`}>
                  <div className={`flex items-center gap-4 px-5 py-3.5 transition-colors group ${
                    isToday ? "bg-indigo-500/5" : "hover:bg-[#18181b]"
                  }`}>
                    <div className="w-6 text-[11px] font-mono text-[#3f3f46] shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span className="text-base shrink-0">{meta?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#e4e4e7] group-hover:text-white transition-colors truncate">
                          {concept.title}
                        </span>
                        {isToday && (
                          <span className="shrink-0 text-[10px] font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 rounded-full px-2 py-0.5">Today</span>
                        )}
                      </div>
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
