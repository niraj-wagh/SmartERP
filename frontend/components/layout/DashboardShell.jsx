"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useCompany } from "@/lib/CompanyProvider";
import { useAuth } from "@/lib/AuthProvider";
import { ShortcutBarProvider, useShortcutBar } from "@/lib/ShortcutContext";
import { matchesCombo } from "@/lib/shortcuts";
import { Spinner } from "@/components/ui/Misc";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FunctionKeyBar from "./FunctionKeyBar";
import CommandPalette from "./CommandPalette";
import { startKeepAlive, stopKeepAlive } from "@/lib/keepAlive";

function ShellInner({ children }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { pageShortcuts } = useShortcutBar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Keep Render backend awake
  useEffect(() => {
    startKeepAlive();
    return () => stopKeepAlive();
  }, []);

  const handleKeyDown = useCallback((e) => {
    const tag = e.target?.tagName;
    const isTyping = tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||e.target?.isContentEditable;

    if (matchesCombo(e,"ctrl+k")) { e.preventDefault(); setPaletteOpen((o) => !o); return; }
    if (matchesCombo(e,"esc") && paletteOpen) { setPaletteOpen(false); return; }
    if (isTyping) return;
    if (matchesCombo(e,"ctrl+h")) { e.preventDefault(); router.push("/dashboard"); return; }
    if (matchesCombo(e,"ctrl+q")) { e.preventDefault(); signOut(); return; }
    if (matchesCombo(e,"f1")) { e.preventDefault(); router.push("/companies"); return; }
    for (const s of pageShortcuts) {
      if (matchesCombo(e, s.combo)) { e.preventDefault(); s.action?.(); return; }
    }
  }, [router, signOut, pageShortcuts, paletteOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen flex bg-ink overflow-hidden">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden no-print" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
        <FunctionKeyBar />
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default function DashboardShell({ children }) {
  const router = useRouter();
  const { activeCompany, loading } = useCompany();

  useEffect(() => {
    if (!loading && !activeCompany) router.replace("/companies");
  }, [loading, activeCompany, router]);

  return (
    <AuthGuard>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-ink">
          <Spinner label="Loading your company…" />
        </div>
      ) : !activeCompany ? (
        <div className="min-h-screen flex items-center justify-center bg-ink">
          <Spinner label="Redirecting to company selection…" />
        </div>
      ) : (
        <ShortcutBarProvider>
          <ShellInner>{children}</ShellInner>
        </ShortcutBarProvider>
      )}
    </AuthGuard>
  );
}
