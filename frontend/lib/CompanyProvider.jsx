"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { api } from "./api";

const CompanyContext = createContext(null);
const STORAGE_KEY = "smarterp.activeCompanyId";

export function CompanyProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    // Read from localStorage on first render (client-side only)
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(STORAGE_KEY) || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await api.companies.list();
      setCompanies(list || []);

      // If current activeCompanyId is no longer in the list (e.g. deleted), clear it
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (stored && !(list || []).some((c) => c.id === stored)) {
        setActiveCompanyId(null);
        if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn("[CompanyProvider] Could not load companies:", err.message);
    }
    setLoading(false);
  }, [user]);

  // Re-fetch whenever the authenticated user changes
  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  const selectCompany = useCallback((id) => {
    setActiveCompanyId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const clearCompany = useCallback(() => {
    setActiveCompanyId(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || null;

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, activeCompanyId, selectCompany, clearCompany, loading, refresh }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
