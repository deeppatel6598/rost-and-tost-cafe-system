"use client";

import { ApiError } from "@/lib/api-client";
import type { CreateOrderInput, SubOrderView } from "@/lib/types";

export interface SubmitResult {
  subOrder: SubOrderView;
  publicToken: string;
  upiLink: string | null;
  replayed: boolean;
}

/** Errors the server will keep rejecting — retrying them is pointless. */
const FATAL_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

export function newIdempotencyKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `chk_${random}`;
}

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submits an order, retrying through a flaky connection.
 *
 * The canteen wifi at 1pm is genuinely bad, and an order that silently
 * vanishes is worse than a visible error — the student stands there believing
 * food is coming. So network failures are retried with backoff rather than
 * surfaced immediately, and the same idempotency key is reused on every
 * attempt so a request that actually landed replays the original order
 * instead of creating a duplicate.
 *
 * Rejections from the server (sold out, stall closed, price changed) are
 * final and returned straight away — retrying those just wastes the
 * student's time.
 */
export async function submitOrder(
  input: CreateOrderInput,
  idempotencyKey: string,
  onRetry?: (attempt: number) => void,
): Promise<SubmitResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      onRetry?.(attempt);
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
      // Don't burn an attempt while the device is plainly offline.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        await waitForOnline();
      }
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(input),
      });

      const data = await res.json().catch(() => ({}) as any);

      if (res.ok) return data as SubmitResult;

      if (FATAL_STATUSES.has(res.status)) {
        throw new ApiError(data?.error || "Could not place the order.", res.status, data?.code);
      }
      // 5xx — the server may recover, so fall through and retry.
      lastError = new ApiError(data?.error || "The kitchen system is not responding.", res.status, data?.code);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Network-level failure: keep the attempt and retry.
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not reach the canteen system. Please show this screen to the counter.");
}

function waitForOnline(): Promise<void> {
  if (typeof window === "undefined" || navigator.onLine !== false) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("online", done);
      resolve();
    };
    window.addEventListener("online", done);
    // Don't wait forever — fall through and let the next attempt fail loudly.
    setTimeout(done, 20000);
  });
}
