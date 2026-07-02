"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/toast";
import { Input, Label } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import AuthShell from "@/components/layout/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/");
  }, [authLoading, user, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created.");
      router.replace("/companies");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <AuthShell
        eyebrow="Almost there"
        title="Confirm your email"
        subtitle={`We sent a confirmation link to ${email}. Click it, then come back and sign in.`}
      >
        <Link href="/login">
          <Button className="w-full" icon={ArrowRight}>
            Back to sign in
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Set up your books."
      subtitle="One account holds up to five companies, each with its own ledgers, stock and vouchers."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Full name</Label>
          <Input
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Asha Verma"
          />
        </div>
        <div>
          <Label>Email address</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
          />
        </div>
        <div>
          <Label hint="min. 6 characters">Password</Label>
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full" icon={UserPlus}>
          Create account
        </Button>
      </form>
      <p className="text-sm text-paper-faint mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-signal hover:underline inline-flex items-center gap-0.5">
          Sign in <ArrowRight size={13} />
        </Link>
      </p>
    </AuthShell>
  );
}
