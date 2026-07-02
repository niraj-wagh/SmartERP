"use client";

import { cn } from "@/lib/format";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn("bg-panel border border-hair rounded-xl", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-hair">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-base font-semibold text-paper">{title}</h2>
        {subtitle && <p className="text-xs text-paper-faint mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
