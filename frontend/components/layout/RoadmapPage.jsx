"use client";

import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function RoadmapPage({ eyebrow, title, description, items }) {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">{eyebrow}</p>
        <h1 className="font-display text-2xl font-semibold text-paper">{title}</h1>
        <p className="text-paper-faint text-sm mt-1 max-w-xl">{description}</p>
      </div>
      <Card className="p-8 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-full bg-panel-2 border border-hair flex items-center justify-center mb-4">
          <Clock size={18} className="text-signal" />
        </div>
        <p className="font-display font-semibold text-paper mb-1">On the roadmap</p>
        <p className="text-xs text-paper-faint max-w-sm mb-6">
          This module isn&apos;t built yet in the MVP. The schema and navigation are already in place — it&apos;s
          ready for the next development sprint.
        </p>
        {items?.length > 0 && (
          <ul className="text-left w-full max-w-sm space-y-2">
            {items.map((it) => (
              <li key={it} className="flex items-center gap-2.5 text-sm text-paper-dim">
                <span className="w-1.5 h-1.5 rounded-full bg-signal/60 shrink-0" />
                {it}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
