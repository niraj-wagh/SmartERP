"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info") => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const toast = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };

  const icons = {
    success: <CheckCircle2 size={16} className="text-green shrink-0" />,
    error: <AlertTriangle size={16} className="text-red shrink-0" />,
    info: <Info size={16} className="text-blue shrink-0" />,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-16 right-4 z-[100] flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fade-in flex items-start gap-2 bg-panel border border-hair rounded-lg px-3.5 py-3 shadow-xl shadow-black/40 max-w-sm text-sm text-paper"
          >
            {icons[t.type]}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-paper-faint hover:text-paper">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
