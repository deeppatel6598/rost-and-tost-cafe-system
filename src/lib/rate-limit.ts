/**
 * Fixed-window rate limiting, held in process memory.
 *
 * Placing a cash order costs the student nothing, so without a limit one
 * person with a loop can bury four kitchens in fake tokens during the lunch
 * rush. Keyed per table session and per IP so neither alone is enough to
 * flood the queue.
 *
 * Per-process, like the rest of the store — on multi-instance hosting each
 * instance counts separately, so the effective limit multiplies by the
 * instance count. A shared counter (Redis, or the database) is the fix when
 * this moves off a single server.
 */

interface Window {
  count: number;
  resetAt: number;
}

const globalForLimiter = globalThis as unknown as { __skRateLimit?: Map<string, Window> };
const windows: Map<string, Window> =
  globalForLimiter.__skRateLimit ?? (globalForLimiter.__skRateLimit = new Map());

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Opportunistic cleanup so the map doesn't grow without bound. */
export function pruneRateLimits(): void {
  const now = Date.now();
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key);
  }
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
