"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
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
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in.");
      router.push(params.get("next") || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="grid w-full max-w-sm gap-5 rounded-2xl border border-border bg-surface p-8 shadow-2">
        <div className="grid gap-1 text-center">
          <span className="t-display-sm">Roast and Toast</span>
          <span className="t-body-sm text-text-muted">Sign in to the counter</span>
        </div>

        {error && <p className="t-body-sm rounded-md bg-status-cancelled-bg px-3 py-2 text-status-cancelled-ink">{error}</p>}

        <label className="grid gap-1.5">
          <span className="t-overline text-text-faint">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="h-12 rounded-md border border-border bg-surface px-3 text-text focus:border-accent"
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
            className="h-12 rounded-md border border-border bg-surface px-3 text-text focus:border-accent"
          />
        </label>

        <Button type="submit" size="admin" fullWidth disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="t-caption text-center text-text-faint">
          Default demo login: admin / roastandtoast123 — change this in your environment before going live.
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
