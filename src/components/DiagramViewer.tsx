"use client";

import { useEffect, useRef } from "react";

export function DiagramViewer({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          background: "#0f172a",
          primaryColor: "#1e40af",
          primaryTextColor: "#e2e8f0",
          lineColor: "#475569",
          secondaryColor: "#0f172a",
          tertiaryColor: "#1e293b",
        },
      });
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      m.default.render(id, code).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      });
    });
  }, [code]);

  return (
    <div
      ref={ref}
      className="rounded-xl bg-slate-900 border border-slate-700 p-4 overflow-x-auto text-center"
    />
  );
}
