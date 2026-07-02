"use client";

import { cn } from "@/lib/format";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-signal text-signal-ink hover:brightness-105 border border-signal font-semibold",
  secondary:
    "bg-panel-2 text-paper hover:bg-hair-soft border border-hair",
  ghost: "bg-transparent text-paper-dim hover:text-paper hover:bg-panel-2 border border-transparent",
  danger: "bg-transparent text-red border border-red/40 hover:bg-red/10",
  outline: "bg-transparent text-paper border border-hair hover:border-signal hover:text-signal",
};

const sizes = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5",
  md: "text-sm px-3.5 py-2 gap-2",
  lg: "text-sm px-5 py-2.5 gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  loading = false,
  disabled,
  icon: Icon,
  shortcut,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={14} /> : null}
      {children}
      {shortcut && !loading && (
        <span className="ml-1 font-mono text-[10px] opacity-60 tracking-wide">{shortcut}</span>
      )}
    </button>
  );
}
