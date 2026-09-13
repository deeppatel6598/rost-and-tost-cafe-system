"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { isValidPhone, PHONE_HELP } from "@/lib/phone";
import { clearRememberedOrders } from "@/lib/my-orders";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CodeEntry } from "@/components/order/CodeEntry";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Getting an order back, and handing the phone over.
 *
 * Two jobs, one sheet, because they are the same question from the student's
 * side: "these aren't my orders". Either they want theirs back, or they want
 * this browser to stop pretending to be someone else.
 *
 * Recovery needs the number *and* proof the student holds it, because the
 * number alone is ten guessable digits. Proof is a code sent to that number —
 * offered first, because someone whose browser forgot them usually cannot
 * remember LP-042 either.
 *
 * The token stays as the second route, and not merely for convenience: SMS
 * will fail one day, and recovery must not have a single point of failure
 * while a student's food is already cooking.
 */
export function RecoverOrderSheet({
  open,
  onClose,
  hasOrders,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  hasOrders: boolean;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** "phone" collects the number; "code" and "token" are the two proofs. */
  const [step, setStep] = useState<"phone" | "code" | "token">("phone");

  const canSubmit = isValidPhone(phone) && token.trim().length > 0;

  function reset() {
    setPhone("");
    setToken("");
    setError(null);
    setBusy(false);
    setStep("phone");
  }

  function finish() {
    reset();
    onClose();
    onChanged();
    router.refresh();
  }

  async function recover() {
    if (!canSubmit) {
      setError(isValidPhone(phone) ? "Enter your token number, like LP-042." : PHONE_HELP);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/session/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, tokenNumber: token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not find that order.");
        setBusy(false);
        return;
      }
      finish();
    } catch {
      setError("Could not reach the canteen. Check your connection and try again.");
      setBusy(false);
    }
  }

  async function startFresh() {
    setBusy(true);
    try {
      await fetch("/api/session/end", { method: "POST" });
      clearRememberedOrders();
      reset();
      onClose();
      // Back to the scan screen: without a seating there is nothing to show.
      router.replace("/scan");
    } catch {
      setError("Could not reach the canteen. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Find my order"
      footer={
        step === "phone" ? (
          <div className="grid gap-2">
            <Button
              size="hero"
              fullWidth
              disabled={!isValidPhone(phone)}
              onClick={() => {
                setError(null);
                setStep("code");
              }}
            >
              Send me a code
            </Button>
            <Button
              variant="ghost"
              size="guest"
              fullWidth
              disabled={!isValidPhone(phone)}
              onClick={() => {
                setError(null);
                setStep("token");
              }}
            >
              I have my token number instead
            </Button>
            {hasOrders && (
              <Button variant="ghost" size="guest" fullWidth disabled={busy} onClick={startFresh}>
                These aren&apos;t mine — start fresh
              </Button>
            )}
          </div>
        ) : step === "token" ? (
          <div className="grid gap-2">
            <Button size="hero" fullWidth disabled={busy} onClick={recover}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Looking…
                </span>
              ) : (
                "Find my order"
              )}
            </Button>
            <Button variant="ghost" size="guest" fullWidth disabled={busy} onClick={() => setStep("phone")}>
              Back
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="guest" fullWidth onClick={() => setStep("phone")}>
            Back
          </Button>
        )
      }
    >
      {step === "phone" && (
        <>
          <p className="t-body-sm text-text-muted">
            Enter the number you gave at checkout. We&apos;ll send a code to it, so only the person
            holding that phone can pick the orders back up.
          </p>

          <label className="mt-4 grid gap-1.5">
            <span className="t-overline text-text-faint">Phone number</span>
            <input
              id="recover-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit number"
              className="h-12 rounded-md border border-border bg-surface px-3 text-[16px] placeholder:text-text-faint focus:border-accent"
            />
          </label>

          <p
            className={cn("t-caption mt-3", error ? "text-danger" : "text-text-faint")}
            role={error ? "alert" : undefined}
          >
            {error ?? "Only orders placed at this table can be found here."}
          </p>
        </>
      )}

      {step === "code" && (
        <CodeEntry
          phone={phone}
          purpose="recover_session"
          submitLabel="Find my order"
          onVerified={async (code) => {
            const res = await fetch("/api/session/recover", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ phone, code }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) return { ok: false, error: data?.error };
            finish();
            return { ok: true };
          }}
        />
      )}

      {step === "token" && (
        <>
          <p className="t-body-sm text-text-muted">
            Enter a token number from your order — the code the counter calls out, like LP-042. It has
            to match an order placed at this table under {phone}.
          </p>

          <label className="mt-4 grid gap-1.5">
            <span className="t-overline text-text-faint">Token number</span>
            <input
              id="recover-token"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              maxLength={12}
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase().slice(0, 12))}
              placeholder="LP-042"
              className="h-12 rounded-md border border-border bg-surface px-3 font-mono text-[16px] uppercase placeholder:font-sans placeholder:text-text-faint focus:border-accent"
            />
          </label>

          <p
            className={cn("t-caption mt-3", error ? "text-danger" : "text-text-faint")}
            role={error ? "alert" : undefined}
          >
            {error ?? "Can't remember it? Ask at the stall counter — they can find you by phone number."}
          </p>
        </>
      )}
    </BottomSheet>
  );
}
