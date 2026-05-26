"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/", label: "Dashboard", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    match: (p: string) => p === "/" || p.startsWith("/concept/"),
  },
  {
    href: "/review", label: "Flashcards", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    match: (p: string) => p === "/review",
  },
  {
    href: "/tutor", label: "AI Tutor", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 12-8 12S4 15.25 4 10a8 8 0 0 1 8-8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    match: (p: string) => p === "/tutor",
  },
  {
    href: "/paths", label: "Paths", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    match: (p: string) => p === "/paths",
  },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="w-[220px] shrink-0 flex flex-col py-5 px-3 min-h-screen sticky top-0 border-r border-[#27272a] bg-[#09090b]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-8 group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-indigo-500/20">
          D
        </div>
        <div>
          <div className="text-[13px] font-semibold text-white tracking-tight leading-none">
            Daily Systems Lab
          </div>
          <div className="text-[10px] text-[#52525b] mt-0.5">Learn · Review · Master</div>
        </div>
      </Link>

      {/* Links */}
      <div className="space-y-0.5 flex-1">
        <div className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest px-2 mb-2">Menu</div>
        {links.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-[#18181b] text-white border border-[#3f3f46]"
                  : "text-[#71717a] hover:text-white hover:bg-[#18181b]"
              )}
            >
              <span className={active ? "text-indigo-400" : "text-[#52525b]"}>{link.icon}</span>
              {link.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </Link>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="mt-6 rounded-xl border border-[#27272a] bg-[#111113] p-3">
        <div className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-2">Shortcuts</div>
        <div className="space-y-1">
          {[["Space", "Reveal"], ["1–4", "Rate"], ["↵", "Send chat"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-[11px] text-[#52525b]">{v}</span>
              <kbd className="text-[10px] text-[#71717a] bg-[#27272a] rounded px-1.5 py-0.5 font-mono">{k}</kbd>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
