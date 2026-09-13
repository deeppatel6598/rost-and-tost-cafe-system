"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Typing in the six digits.
 *
 * One input, not six boxes. Six boxes look neater in a screenshot and are
 * worse in the hand: they fight autofill, they lose a pasted code, and a
 * mistyped digit means hunting for the right box. A single field with wide
 * letter-spacing reads the same and behaves properly, including with the
 * one-tap SMS autofill that both mobile keyboards offer.
 *
 * `autoComplete="one-time-code"` is what makes iOS and Android surface the
 * code above the keyboard, so most students never type it at all.
 */
export function CodeEntry({
  phone,
  purpose,
  submitLabel,
  onVerified,
  autoSend = true,
}: {
  phone: string;
  purpose: "verify_device" | "recover_session";
  submitLabel: string;
  /** Given the code, do whatever this flow means by "verify". */
  onVerified: (code: string) => Promise<{ ok: boolean; error?: string }>;
  autoSend?: boolean;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentOnce = useRef(false);

  const send = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 503) {
        // The channel is down. Say so honestly and point at the counter
        // rather than inviting a retry that cannot work.
        setUnavailable(true);
        setError(data?.error ?? "We can't send codes right now.");
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Could not send the code.");
        const retry = Number(res.headers.get("retry-after") ?? 0);
        if (retry > 0) setCooldown(retry);
        return;
      }

      setCooldown(data?.cooldownSeconds ?? 30);
      setNote(
        data?.resent
          ? "New code sent — use the latest message, the earlier one no longer works."
          : `Code sent to ${phone}.`,
      );
      inputRef.current?.focus();
    } catch {
      setError("Could not reach the canteen. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }, [phone, purpose]);

  useEffect(() => {
    if (!autoSend || sentOnce.current) return;
    sentOnce.current = true;
    void send();
  }, [autoSend, send]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit() {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    const result = await onVerified(code);
    if (!result.ok) {
      setError(result.error ?? "That code isn't right.");
      setCode("");
      inputRef.current?.focus();
    }
    setBusy(false);
  }

  if (unavailable) {
    return (
      <div className="grid gap-3">
        <p className="t-body-sm text-text-muted">
          We can&apos;t send verification codes at the moment. Your order is safe — the token on your
          order screen is all the counter needs.
        </p>
        <p className="t-caption text-text-faint">
          Staff at the stall can look you up by phone number if you need your earlier orders.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="t-body-sm text-text-muted">
        We sent a six-digit code to <span className="t-mono">{phone}</span>. Enter it to see all your
        orders on this phone.
      </p>

      <label className="grid gap-1.5">
        <span className="t-overline text-text-faint">Six-digit code</span>
        <input
          ref={inputRef}
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(next);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          aria-describedby="otp-help"
          className="h-14 rounded-md border border-border bg-surface px-3 text-center font-mono text-[26px] tracking-[0.35em] placeholder:text-text-faint focus:border-accent"
        />
      </label>

      <p
        id="otp-help"
        className={cn("t-caption", error ? "text-danger" : "text-text-faint")}
        role={error ? "alert" : "status"}
      >
        {error ?? note ?? "It can take a few seconds to arrive."}
      </p>

      <Button size="hero" fullWidth disabled={code.length !== 6 || busy} onClick={submit}>
        {busy ? (
          <span className="flex items-center gap-2">
            <Spinner /> Checking…
          </span>
        ) : (
          submitLabel
        )}
      </Button>

      <button
        type="button"
        onClick={() => void send()}
        disabled={cooldown > 0 || sending}
        className="t-body-sm min-h-[44px] font-semibold text-text-muted disabled:text-text-faint"
      >
        {sending
          ? "Sending…"
          : cooldown > 0
            ? `Send another code in ${cooldown}s`
            : "Send another code"}
      </button>
    </div>
  );
}
