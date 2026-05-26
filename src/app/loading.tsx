export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-slate-800" />
      <div className="h-40 rounded-2xl bg-slate-900" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-900" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-900" />
        ))}
      </div>
    </div>
  );
}
