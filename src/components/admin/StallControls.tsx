"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { StallView } from "@/lib/types";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export function StallControls({ canEditPayout }: { canEditPayout: boolean }) {
  const { showToast } = useToast();
  const [stall, setStall] = useState<StallView | null>(null);
  const [vpa, setVpa] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [confirmingPayout, setConfirmingPayout] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stall");
    if (!res.ok) return;
    const data = await res.json();
    setStall(data.stall);
    setVpa(data.stall.upiVpa);
    setPayeeName(data.stall.upiPayeeName);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback(
    async (body: Record<string, unknown>, successMessage?: string) => {
      setSaving(true);
      try {
        const res = await fetch("/api/admin/stall", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStall(data.stall);
        if (successMessage) showToast(successMessage, "success");
        return true;
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not save.", "danger");
        load();
        return false;
      } finally {
        setSaving(false);
      }
    },
    [showToast, load],
  );

  if (!stall) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  const payoutChanged = vpa.trim() !== stall.upiVpa || payeeName.trim() !== stall.upiPayeeName;

  return (
    <div className="grid max-w-2xl gap-6 px-4 py-5">
      <div>
        <span className="t-display-sm block">{stall.name}</span>
        <span className="t-body-sm text-text-muted">{stall.availability.label}</span>
      </div>

      <section className="grid gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="t-title-md">Taking orders</h2>

        <div className="grid gap-2">
          {(
            [
              {
                mode: "scheduled" as const,
                title: "Follow my hours",
                body: `Open ${stall.opensAt}–${stall.closesAt} automatically.`,
              },
              {
                mode: "open" as const,
                title: "Open now",
                body: "Keep serving even outside the hours below.",
              },
              {
                mode: "closed" as const,
                title: "Closed",
                body: "Stop taking orders until you switch back.",
              },
            ]
          ).map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => patch({ serviceMode: option.mode }, `Stall set to “${option.title}”`)}
              disabled={saving}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left",
                stall.serviceMode === option.mode ? "border-accent bg-accent-tint" : "border-border",
              )}
            >
              <span className="flex-1">
                <span className="t-title-sm block">{option.title}</span>
                <span className="t-body-sm block text-text-muted">{option.body}</span>
              </span>
              <span
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-2",
                  stall.serviceMode === option.mode ? "border-accent bg-accent" : "border-border-strong",
                )}
              />
            </button>
          ))}
        </div>

        <p
          className={cn(
            "t-body-sm rounded-md px-3 py-2",
            stall.availability.canOrder
              ? "bg-status-served-bg text-status-served-ink"
              : "bg-status-cancelled-bg text-status-cancelled-ink",
          )}
        >
          Students {stall.availability.canOrder ? "can order right now" : "cannot order right now"} —{" "}
          {stall.availability.label}
        </p>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
          <div>
            <span className="t-title-sm block">Pause new orders</span>
            <span className="t-body-sm text-text-muted">Stay open but stop the queue for a few minutes.</span>
          </div>
          <ToggleSwitch checked={stall.isPaused} onChange={(v) => patch({ isPaused: v })} label="Pause orders" />
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="t-title-md">Opening hours</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="t-overline text-text-faint">Opens</span>
            <input
              type="time"
              defaultValue={stall.opensAt}
              onBlur={(e) => e.target.value !== stall.opensAt && patch({ opensAt: e.target.value }, "Hours updated")}
              className="h-12 rounded-md border border-border bg-surface px-3"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="t-overline text-text-faint">Closes</span>
            <input
              type="time"
              defaultValue={stall.closesAt}
              onBlur={(e) => e.target.value !== stall.closesAt && patch({ closesAt: e.target.value }, "Hours updated")}
              className="h-12 rounded-md border border-border bg-surface px-3"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="t-title-md">Payment methods</h2>
        <div className="flex items-center justify-between gap-4">
          <span className="t-title-sm">Accept cash</span>
          <ToggleSwitch checked={stall.acceptsCash} onChange={(v) => patch({ acceptsCash: v })} label="Accept cash" />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
          <span className="t-title-sm">Accept UPI</span>
          <ToggleSwitch checked={stall.acceptsUpi} onChange={(v) => patch({ acceptsUpi: v })} label="Accept UPI" />
        </div>
        {!stall.acceptsCash && !stall.acceptsUpi && (
          <p className="t-body-sm rounded-md bg-danger-bg px-3 py-2 text-danger">
            Both methods are off, so students cannot check out at all.
          </p>
        )}
      </section>

      <section className="grid gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="t-title-md">Where the money goes</h2>

        {canEditPayout ? (
          <>
            <label className="grid gap-1.5">
              <span className="t-overline text-text-faint">UPI ID</span>
              <input
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                className="h-12 rounded-md border border-border bg-surface px-3 font-mono"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="t-overline text-text-faint">Payee name</span>
              <input
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="h-12 rounded-md border border-border bg-surface px-3"
              />
            </label>

            {/* A changed VPA sends every future rupee somewhere new, so it
                gets a deliberate confirmation rather than an autosave. */}
            {confirmingPayout ? (
              <div className="grid gap-2 rounded-md border border-danger bg-danger-bg p-3">
                <span className="t-title-sm text-danger">Send payments to a different account?</span>
                <span className="t-body-sm text-danger/85">
                  From now on students pay <span className="font-mono font-semibold">{vpa.trim()}</span>. Check it
                  character by character — a wrong ID sends your takings to a stranger. This change is recorded.
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="admin"
                    variant="danger"
                    disabled={saving}
                    onClick={async () => {
                      const ok = await patch(
                        { upiVpa: vpa.trim(), upiPayeeName: payeeName.trim() },
                        "Payment details updated",
                      );
                      if (ok) setConfirmingPayout(false);
                    }}
                  >
                    Yes, change it
                  </Button>
                  <Button size="admin" variant="ghost" onClick={() => setConfirmingPayout(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="admin"
                disabled={!payoutChanged || !vpa.trim()}
                className="justify-self-start"
                onClick={() => setConfirmingPayout(true)}
              >
                Update payment details
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="t-body-sm text-text-muted">
              Payments go to <span className="font-mono text-text">{stall.upiVpa}</span> ({stall.upiPayeeName}).
            </p>
            <p className="t-caption text-text-faint">Only the stall owner can change this.</p>
          </>
        )}
      </section>
    </div>
  );
}
