"use client";

import { Sparkles, Hash, Receipt, BookOpen, Boxes } from "lucide-react";

const FEATURES = [
  { icon: BookOpen, text: "Customer & supplier ledgers, the Tally way" },
  { icon: Boxes, text: "Stock items with live quantity tracking" },
  { icon: Receipt, text: "GST-ready sales & purchase vouchers" },
  { icon: Hash, text: "Every screen reachable without a mouse" },
];

export default function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <div className="min-h-screen flex bg-ink">
      <div className="hidden lg:flex w-[44%] xl:w-[40%] flex-col justify-between border-r border-hair px-12 py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--hair) 1px, transparent 1px), linear-gradient(90deg, var(--hair) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center">
              <Sparkles size={16} className="text-signal" />
            </div>
            <span className="font-display font-semibold text-lg text-paper tracking-tight">SmartERP</span>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-4">
            Billing · Inventory · Accounting
          </p>
          <h1 className="font-display text-4xl xl:text-[2.75rem] leading-[1.08] font-semibold text-paper max-w-md">
            Run the books like it&apos;s 1988 — but faster, and in the browser.
          </h1>
          <p className="text-paper-dim text-sm mt-5 max-w-sm leading-relaxed">
            SmartERP keeps Tally&apos;s keyboard-first discipline and adds modern cloud
            convenience: real-time multi-company books, accessible from anywhere.
          </p>
        </div>

        <div className="relative space-y-3">
          {FEATURES.map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-sm text-paper-dim">
              <div className="w-7 h-7 rounded-md bg-panel border border-hair flex items-center justify-center shrink-0">
                <f.icon size={13} className="text-paper-faint" />
              </div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-8 h-8 rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center">
              <Sparkles size={16} className="text-signal" />
            </div>
            <span className="font-display font-semibold text-lg text-paper">SmartERP</span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-2">{eyebrow}</p>
          <h2 className="font-display text-2xl font-semibold text-paper mb-2">{title}</h2>
          {subtitle && <p className="text-sm text-paper-faint mb-7 leading-relaxed">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
