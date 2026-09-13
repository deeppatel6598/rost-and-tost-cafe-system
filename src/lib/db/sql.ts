import postgres from "postgres";

/**
 * The Postgres connection.
 *
 * Two things about running this on serverless hosting, both learned the hard
 * way by everyone who has done it:
 *
 * 1. **Use the pooled connection string.** A direct Postgres connection allows
 *    around sixty clients; a serverless platform will happily spin up a
 *    function instance per concurrent request and exhaust that during one
 *    lunch rush. Supabase's pooler (Supavisor, port 6543) multiplexes them.
 *    DATABASE_URL should point at the pooler, not at db.<ref>.supabase.co:5432.
 *
 * 2. **Keep the per-instance pool tiny.** Each function instance gets its own
 *    pool, so `max: 1` in a serverless environment and a handful locally. The
 *    pooler does the real pooling; anything larger here just multiplies.
 *
 * The client is cached on globalThis because Next.js re-evaluates modules on
 * every hot reload in development, and a fresh pool per reload leaks
 * connections until the database refuses new ones.
 */

const connectionString = process.env.DATABASE_URL;

// `next build` imports every route module to collect its metadata, without
// ever running a query. Throwing at import time therefore broke the build on
// any machine that didn't happen to have production credentials — CI included.
// The check still fires on a real server start.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!connectionString && process.env.NODE_ENV === "production" && !isBuildPhase) {
  throw new Error(
    "DATABASE_URL is not set. Point it at the Supabase pooled connection string (port 6543).",
  );
}

/** Serverless gets one connection per instance; a long-lived server can hold a few. */
const isServerless = Boolean(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_REGION);

function createClient() {
  return postgres(connectionString ?? "", {
    // snake_case in the database, camelCase in TypeScript, mapped both ways
    // automatically. This is what lets `select *` land straight on the domain
    // types in src/lib/types.ts with no hand-written mapper per table.
    transform: postgres.camel,
    max: isServerless ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // The pooler runs in transaction mode, which cannot support prepared
    // statements across checkouts.
    prepare: false,
    // Timestamps come back as ISO strings, matching the types the rest of the
    // app already speaks. Doing it here means no mapper has to remember.
    types: {
      date: {
        to: 1184,
        from: [1082, 1114, 1184],
        serialize: (v: Date | string) => (v instanceof Date ? v.toISOString() : v),
        parse: (v: string) => new Date(v).toISOString(),
      },
    },
    onnotice: () => {},
  });
}

const globalForSql = globalThis as unknown as { __skCanteenSql?: ReturnType<typeof createClient> };

export const sql = globalForSql.__skCanteenSql ?? (globalForSql.__skCanteenSql = createClient());

/**
 * The client, or a transaction handle standing in for it.
 *
 * Repository functions take this so the same function works standalone and
 * inside a transaction — which is what stops, say, a token number being
 * allocated on a separate connection and surviving a rolled-back order.
 */
export type Db = typeof sql | postgres.TransactionSql<{ date: string }>;

/**
 * Hands a plain object to postgres.js for an INSERT or UPDATE fragment.
 *
 * `sql(obj)` builds `col = value, …` from the object's keys — with
 * transform.camel above, `basePrice` becomes `base_price` on the way in. Its
 * published types want a narrower shape than our domain types express, so the
 * cast lives here once instead of at every call site.
 */
export function fields<T extends object>(value: T) {
  return value as unknown as Record<string, never>;
}

/** True when the app has somewhere to store data. Used by the health check. */
export function isConfigured(): boolean {
  return Boolean(connectionString);
}
