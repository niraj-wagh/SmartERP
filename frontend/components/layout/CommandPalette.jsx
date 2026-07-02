"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { COMMANDS } from "@/lib/nav";

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? COMMANDS
      : COMMANDS.filter(
          (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
        );
    return list;
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  function go(cmd) {
    if (!cmd) return;
    router.push(cmd.href);
    onClose();
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[index]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  let lastGroup = null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4 no-print">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-panel border border-hair rounded-xl shadow-2xl shadow-black/50 fade-in overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-hair">
          <Search size={15} className="text-paper-faint shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a ledger, voucher, or report…"
            className="flex-1 bg-transparent outline-none text-sm text-paper placeholder:text-paper-faint"
          />
          <span className="keycap !py-0.5 !px-1.5 !text-[10px]">esc</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-paper-faint">No matches for “{query}”.</p>
          )}
          {results.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup;
            lastGroup = cmd.group;
            return (
              <div key={cmd.href + cmd.label}>
                {showGroup && (
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-mono uppercase tracking-[0.1em] text-paper-faint">
                    {cmd.group}
                  </p>
                )}
                <button
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(cmd)}
                  className={
                    "w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-left " +
                    (i === index ? "bg-signal/10 text-signal" : "text-paper-dim hover:text-paper")
                  }
                >
                  <span>{cmd.label}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <span className="font-mono text-[10px] text-paper-faint">{cmd.shortcut}</span>
                    )}
                    {i === index && <CornerDownLeft size={12} />}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-hair text-[10px] text-paper-faint">
          <span className="flex items-center gap-1">
            <ArrowUp size={10} /> <ArrowDown size={10} /> navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft size={10} /> select
          </span>
        </div>
      </div>
    </div>
  );
}
