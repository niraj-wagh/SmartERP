"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/format";

export default function Sidebar({ open, onNavigate }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    NAV.forEach((n) => {
      if (n.type === "group" && n.items.some((i) => pathname?.startsWith(i.href))) {
        init[n.label] = true;
      }
    });
    return init;
  });

  return (
    <aside
      className={cn(
        "no-print bg-ink-2 border-r border-hair w-64 shrink-0 flex flex-col",
        "fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="h-14 flex items-center gap-2 px-5 border-b border-hair shrink-0">
        <div className="w-7 h-7 rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center">
          <Sparkles size={14} className="text-signal" />
        </div>
        <span className="font-display font-semibold text-paper tracking-tight">SmartERP</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map((item) => {
          if (item.type === "link") {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-signal/10 text-signal border border-signal/30"
                    : "text-paper-dim hover:text-paper hover:bg-panel-2 border border-transparent"
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.roadmap && (
                  <span className="text-[9px] font-mono text-paper-faint border border-hair rounded px-1 py-0.5">
                    SOON
                  </span>
                )}
              </Link>
            );
          }

          const isExpanded = expanded[item.label];
          const Icon = item.icon;
          const groupActive = item.items.some((i) => pathname?.startsWith(i.href));

          return (
            <div key={item.label}>
              <button
                onClick={() => setExpanded((e) => ({ ...e, [item.label]: !e[item.label] }))}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  groupActive ? "text-paper" : "text-paper-dim hover:text-paper hover:bg-panel-2"
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={13}
                  className={cn("transition-transform", isExpanded && "rotate-180")}
                />
              </button>
              {isExpanded && (
                <div className="ml-[1.6rem] border-l border-hair pl-3 my-1 space-y-0.5">
                  {item.items.map((sub) => {
                    const active = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onNavigate}
                        className={cn(
                          "block px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                          active
                            ? "bg-signal/10 text-signal border border-signal/30"
                            : "text-paper-faint hover:text-paper hover:bg-panel-2 border border-transparent"
                        )}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-hair shrink-0">
        <p className="text-[10px] text-paper-faint font-mono leading-relaxed">
          Up to 5 companies / account
          <br />
          Fully keyboard-navigable
        </p>
      </div>
    </aside>
  );
}
