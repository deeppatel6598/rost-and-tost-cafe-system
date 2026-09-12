"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { isValidPhone, PHONE_HELP } from "@/lib/phone";
import { clearRememberedOrders } from "@/lib/my-orders";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Getting an order back, and handing the phone over.
 *
 * Two jobs, one sheet, because they are the same question from the student's
 * side: "these aren't my orders". Either they want theirs back, or they want
 * this browser to stop pretending to be someone else.
 *
 * Recovery asks for the number *and* the token, because the number alone is
 * ten guessable digits. Paired with having just scanned this table's printed
 * code, that is enough without sending an SMS.
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

  const canSubmit = isValidPhone(phone) && token.trim().length > 0;

  function reset() {
    setPhone("");
    setToken("");
    setError(null);
    setBusy(false);
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
      reset();
      onClose();
      onChanged();
      router.refresh();
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
          {hasOrders && (
            <Button variant="ghost" size="guest" fullWidth disabled={busy} onClick={startFresh}>
              These aren&apos;t mine — start fresh
            </Button>
          )}
        </div>
      }
    >
      <p className="t-body-sm text-text-muted">
        Enter the number you gave at checkout and the token from your order. Both have to match an order placed
        at this table.
      </p>

      <label className="mt-4 grid gap-1.5">
        <span className="t-overline text-text-faint">Phone number</span>
        <input
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

      <label className="mt-3 grid gap-1.5">
        <span className="t-overline text-text-faint">Token number</span>
        <input
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
        {error ?? "Can't remember either? Ask at the stall counter — they can find you by phone number."}
      </p>
    </BottomSheet>
  );
}
