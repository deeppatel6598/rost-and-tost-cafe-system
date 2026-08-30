"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in.");

      const next = params.get("next");
      router.push(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-sm gap-5 rounded-2xl border border-border bg-surface p-8 shadow-2"
      >
        <div className="grid gap-1 text-center">
          <span className="t-display-sm">SK Canteen</span>
          <span className="t-body-sm text-text-muted">Stall sign in</span>
        </div>

        {error && (
          <p className="t-body-sm rounded-md bg-danger-bg px-3 py-2 text-danger" role="alert">
            {error}
          </p>
        )}

        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Phone number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={10}
            autoComplete="username"
            required
            className="h-12 rounded-md border border-border bg-surface px-3 text-[15px] focus:border-accent"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="h-12 rounded-md border border-border bg-surface px-3 text-[15px] focus:border-accent"
          />
        </label>

        <Button type="submit" size="admin" fullWidth disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        <p className="t-caption text-center text-text-faint">
          Demo logins — stalls: 9000000011 / 9000000021 / 9000000031 / 9000000041, password{" "}
          <span className="font-mono">stall123</span>. Supervisor: 9000000001 /{" "}
          <span className="font-mono">canteen123</span>. Change these before going live.
        </p>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
