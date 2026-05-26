import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="text-center space-y-4">
        <div className="text-5xl">404</div>
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-slate-400 text-sm">This concept or page doesn&apos;t exist yet.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
