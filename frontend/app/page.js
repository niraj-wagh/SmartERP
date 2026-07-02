"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { Spinner } from "@/components/ui/Misc";

export default function RootPage() {
  const { loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("smarterp.activeCompanyId") : null;
    router.replace(stored ? "/dashboard" : "/companies");
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <Spinner label="Loading SmartERP…" />
    </div>
  );
}
