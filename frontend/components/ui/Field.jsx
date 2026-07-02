"use client";

import { cn } from "@/lib/format";
import { forwardRef } from "react";

export function Label({ children, hint, required }) {
  return (
    <label className="flex items-baseline justify-between mb-1.5">
      <span className="text-xs font-medium text-paper-dim tracking-wide">
        {children}
        {required && <span className="text-signal ml-0.5">*</span>}
      </span>
      {hint && <span className="text-[10px] text-paper-faint font-mono">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full bg-ink-2 border rounded-md px-3 py-2 text-sm text-paper placeholder:text-paper-faint outline-none transition-colors",
        error ? "border-red" : "border-hair focus:border-signal",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, error, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-ink-2 border rounded-md px-3 py-2 text-sm text-paper placeholder:text-paper-faint outline-none transition-colors resize-none",
        error ? "border-red" : "border-hair focus:border-signal",
        className
      )}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, error, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full bg-ink-2 border rounded-md px-3 py-2 text-sm text-paper outline-none transition-colors appearance-none",
        error ? "border-red" : "border-hair focus:border-signal",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="text-[11px] text-red mt-1">{children}</p>;
}
