"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

export default function Modal({ open, onClose, title, eyebrow, children, width = "max-w-lg", footer }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto no-print">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative w-full bg-panel border border-hair rounded-xl shadow-2xl shadow-black/50 fade-in my-8",
          width
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-hair">
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal mb-1">
                {eyebrow}
              </p>
            )}
            <h2 className="font-display text-base font-semibold text-paper">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-paper-faint hover:text-paper rounded-md p-1 hover:bg-panel-2"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-hair flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
