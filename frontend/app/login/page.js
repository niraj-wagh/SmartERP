"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/toast";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import AuthShell from "@/components/layout/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/");
  }, [authLoading, user, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back.");
    router.replace("/");
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back to the ledger."
      subtitle="Pick up exactly where you left off — your companies, ledgers and vouchers are right where you keyed them in."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Email address</Label>
          <Input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full" icon={KeyRound}>
          Sign in
        </Button>
      </form>
      <p className="text-sm text-paper-faint mt-6 text-center">
        New to SmartERP?{" "}
        <Link href="/signup" className="text-signal hover:underline inline-flex items-center gap-0.5">
          Create an account <ArrowRight size={13} />
        </Link>
      </p>
    </AuthShell>
  );
}
