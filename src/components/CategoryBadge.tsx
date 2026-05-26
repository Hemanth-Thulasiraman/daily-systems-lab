import { CATEGORY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const meta = CATEGORY_META[category] ?? { label: category, color: "text-zinc-400", bg: "bg-zinc-400/10", icon: "📚" };
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border",
      meta.bg, meta.color,
      "border-current/20",
      className
    )}>
      <span className="text-[10px]">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function DifficultyBadge({ difficulty, className }: { difficulty: string; className?: string }) {
  const styles: Record<string, string> = {
    BEGINNER:     "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
    INTERMEDIATE: "text-amber-400  bg-amber-400/8  border-amber-400/20",
    ADVANCED:     "text-rose-400   bg-rose-400/8   border-rose-400/20",
  };
  const labels: Record<string, string> = {
    BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced",
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border",
      styles[difficulty] ?? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
      className
    )}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}
