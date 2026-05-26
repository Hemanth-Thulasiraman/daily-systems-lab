import { CATEGORY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const meta = CATEGORY_META[category] ?? { label: category, color: "text-slate-400", bg: "bg-slate-400/10", icon: "📚" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.bg, meta.color, className)}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function DifficultyBadge({ difficulty, className }: { difficulty: string; className?: string }) {
  const colors: Record<string, string> = {
    BEGINNER: "text-emerald-400 bg-emerald-400/10",
    INTERMEDIATE: "text-amber-400 bg-amber-400/10",
    ADVANCED: "text-red-400 bg-red-400/10",
  };
  const labels: Record<string, string> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[difficulty] ?? "text-slate-400 bg-slate-400/10", className)}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}
