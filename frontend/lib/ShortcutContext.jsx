"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ShortcutContext = createContext(null);

export function ShortcutBarProvider({ children }) {
  const [pageShortcuts, setPageShortcuts] = useState([]);

  const register = useCallback((list) => {
    setPageShortcuts(list || []);
  }, []);

  return (
    <ShortcutContext.Provider value={{ pageShortcuts, register }}>
      {children}
    </ShortcutContext.Provider>
  );
}

export function useShortcutBar() {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error("useShortcutBar must be used within ShortcutBarProvider");
  return ctx;
}

// Pages call this with a list of { combo, display, label, action } to populate
// both the footer Function-Key bar and the active key bindings for that screen.
export function usePageShortcuts(list, deps = []) {
  const { register } = useShortcutBar();
  useEffect(() => {
    register(list);
    return () => register([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
