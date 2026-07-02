// Central keyboard-shortcut matching utility.
// Combos are lowercase, '+' separated, e.g. "ctrl+k", "shift+f8", "esc".

export function comboFromEvent(e) {
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  let key = e.key.toLowerCase();
  if (key === "escape") key = "esc";
  if (key === " ") key = "space";
  if (!["control", "alt", "shift", "meta"].includes(key)) parts.push(key);
  return parts.join("+");
}

export function matchesCombo(e, combo) {
  return comboFromEvent(e) === combo.toLowerCase();
}

// Global shortcuts active anywhere inside the dashboard shell.
export const GLOBAL_SHORTCUTS = [
  { combo: "ctrl+k", label: "Command search", display: "Ctrl K" },
  { combo: "ctrl+h", label: "Gateway / Home", display: "Ctrl H" },
  { combo: "ctrl+q", label: "Log out", display: "Ctrl Q" },
  { combo: "f1", label: "Switch company", display: "F1" },
];
