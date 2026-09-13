-- Shut the PostgREST door.
--
-- Supabase exposes every table over an HTTP API reachable with the "anon" key,
-- and that key is public by design — it ships in client bundles. With RLS off,
-- anyone holding it could read staff_users password hashes and every student's
-- phone number, and write to any table.
--
-- This app never uses that API. It connects server-side over a Postgres
-- connection string as the owning role, which bypasses RLS. So enabling RLS
-- with NO policies is exactly right here: anon and authenticated get nothing,
-- and the app is unaffected. The linter will report "RLS enabled, no policy" —
-- that is the intended state, not an oversight.
--
-- If a future feature ever needs supabase-js in the browser, it must add
-- explicit policies for that table rather than turning this back off.
alter table public.stalls enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_variants enable row level security;
alter table public.item_addon_groups enable row level security;
alter table public.item_addons enable row level security;
alter table public.dining_tables enable row level security;
alter table public.visits enable row level security;
alter table public.orders enable row level security;
alter table public.sub_orders enable row level security;
alter table public.sub_order_items enable row level security;
alter table public.staff_users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.idempotency_keys enable row level security;
