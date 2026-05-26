"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: "⚡", match: (p: string) => p === "/" || p.startsWith("/concept/") },
  { href: "/review", label: "Review Cards", icon: "🃏", match: (p: string) => p === "/review" },
  { href: "/tutor", label: "AI Tutor", icon: "🤖", match: (p: string) => p === "/tutor" },
  { href: "/paths", label: "Learning Paths", icon: "🗺️", match: (p: string) => p === "/paths" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="w-52 shrink-0 flex flex-col gap-1 py-6 px-3 border-r border-slate-800 min-h-screen sticky top-0 bg-slate-950">
      <div className="px-3 mb-6">
        <Link href="/" className="block">
          <div className="text-sm font-bold text-white tracking-tight hover:text-indigo-300 transition-colors">
            Daily Systems Lab
          </div>
        </Link>
        <div className="text-xs text-slate-600 mt-0.5">Learn · Review · Master</div>
      </div>

      <div className="space-y-0.5">
        {links.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-3 pt-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-600 space-y-1">
          <div className="text-slate-500 font-medium">Quick keys</div>
          <div>Space — reveal card</div>
          <div>1–4 — rate card</div>
          <div>Enter — send chat</div>
        </div>
      </div>
    </nav>
  );
}
