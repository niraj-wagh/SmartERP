"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) setProfile({ email: data.session.user.email, full_name: data.session.user.user_metadata?.full_name });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setProfile(s?.user ? { email: s.user.email, full_name: s.user.user_metadata?.full_name } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.localStorage.removeItem("smarterp.activeCompanyId");
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading: session === undefined, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
