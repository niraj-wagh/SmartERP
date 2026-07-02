"use client";

import { cn } from "@/lib/format";
import { Loader2, Inbox } from "lucide-react";

export function Badge({ children, tone = "default", className }) {
  const tones = {
    default: "bg-panel-2 text-paper-dim border-hair",
    green: "bg-green/10 text-green border-green/30",
    red: "bg-red/10 text-red border-red/30",
    amber: "bg-signal/10 text-signal border-signal/30",
    blue: "bg-blue/10 text-blue border-blue/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border font-mono tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-paper-faint text-sm">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-11 h-11 rounded-full bg-panel-2 border border-hair flex items-center justify-center mb-4">
        <Icon size={18} className="text-paper-faint" />
      </div>
      <p className="font-display text-sm font-semibold text-paper">{title}</p>
      {description && <p className="text-xs text-paper-faint mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Kbd({ children }) {
  return <span className="keycap !py-0.5 !px-1.5 !text-[10px]">{children}</span>;
}
