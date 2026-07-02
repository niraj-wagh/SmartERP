"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, ChevronDown, LogOut, Building2, User } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useCompany } from "@/lib/CompanyProvider";

export default function Topbar({ onMenuClick, onSearchClick }) {
  const { profile, user, signOut } = useAuth();
  const { activeCompany } = useCompany();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="no-print h-14 shrink-0 border-b border-hair bg-ink-2/80 backdrop-blur flex items-center gap-3 px-4 lg:px-5 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-paper-dim hover:text-paper p-1.5 -ml-1.5 rounded-md hover:bg-panel-2"
      >
        <Menu size={18} />
      </button>

      <Link href="/companies" className="hidden sm:flex items-center gap-2 group">
        <Building2 size={14} className="text-paper-faint group-hover:text-signal" />
        <div className="leading-tight">
          <p className="text-[13px] font-medium text-paper group-hover:text-signal transition-colors">
            {activeCompany?.name || "Select Company"}
          </p>
          <p className="text-[10px] text-paper-faint font-mono">FY {activeCompany?.financial_year || "—"}</p>
        </div>
      </Link>

      <div className="flex-1" />

      <button
        onClick={onSearchClick}
        className="hidden sm:flex items-center gap-2 bg-ink-2 border border-hair hover:border-signal rounded-md px-3 py-1.5 text-paper-faint hover:text-paper transition-colors text-sm w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search or jump to…</span>
        <span className="keycap !py-0.5 !px-1.5 !text-[10px]">
          <b>Ctrl</b>K
        </span>
      </button>

      <button
        onClick={onSearchClick}
        className="sm:hidden text-paper-dim hover:text-paper p-1.5 rounded-md hover:bg-panel-2"
      >
        <Search size={18} />
      </button>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-md hover:bg-panel-2 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-panel-2 border border-hair flex items-center justify-center text-xs font-semibold text-paper">
            {(profile?.full_name || profile?.email || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <ChevronDown size={13} className="text-paper-faint hidden sm:block" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-panel border border-hair rounded-lg shadow-xl shadow-black/40 py-1.5 fade-in">
            <div className="px-3 py-2 border-b border-hair">
              <p className="text-xs font-medium text-paper truncate">{profile?.full_name || "Account"}</p>
              <p className="text-[11px] text-paper-faint truncate">{profile?.email || user?.email}</p>
            </div>
            <Link
              href="/companies"
              className="flex items-center gap-2 px-3 py-2 text-sm text-paper-dim hover:text-paper hover:bg-panel-2"
              onClick={() => setMenuOpen(false)}
            >
              <Building2 size={14} /> Switch company
              <span className="ml-auto keycap !py-0.5 !px-1.5 !text-[10px]">F1</span>
            </Link>
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-paper-dim hover:text-paper hover:bg-panel-2"
              onClick={() => setMenuOpen(false)}
            >
              <User size={14} /> Administration
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red hover:bg-red/10"
            >
              <LogOut size={14} /> Log out
              <span className="ml-auto keycap !py-0.5 !px-1.5 !text-[10px]">
                <b>Ctrl</b>Q
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
