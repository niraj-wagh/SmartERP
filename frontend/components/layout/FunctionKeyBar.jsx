"use client";

import { useShortcutBar } from "@/lib/ShortcutContext";
import { GLOBAL_SHORTCUTS } from "@/lib/shortcuts";

function splitDisplay(display) {
  // "Ctrl K" -> { mod: "Ctrl", key: "K" } for keycap rendering
  const parts = display.split(" ");
  if (parts.length === 1) return { mod: null, key: parts[0] };
  return { mod: parts.slice(0, -1).join("+"), key: parts[parts.length - 1] };
}

function Keycap({ display, label, onClick }) {
  const { mod, key } = splitDisplay(display);
  return (
    <button onClick={onClick} className="keycap" title={label}>
      {mod && <b>{mod}</b>}
      <span>{key}</span>
      <span className="hidden xl:inline text-paper-faint font-sans normal-case font-normal">{label}</span>
    </button>
  );
}

export default function FunctionKeyBar() {
  const { pageShortcuts } = useShortcutBar();

  return (
    <footer className="no-print h-11 shrink-0 border-t border-hair bg-ink-2 px-3 flex items-center gap-1.5 overflow-x-auto sticky bottom-0 z-30">
      {pageShortcuts.map((s) => (
        <Keycap key={s.combo} display={s.display} label={s.label} onClick={s.action} />
      ))}
      {pageShortcuts.length > 0 && <span className="w-px h-5 bg-hair mx-1 shrink-0" />}
      {GLOBAL_SHORTCUTS.map((s) => (
        <Keycap key={s.combo} display={s.display} label={s.label} />
      ))}
    </footer>
  );
}
