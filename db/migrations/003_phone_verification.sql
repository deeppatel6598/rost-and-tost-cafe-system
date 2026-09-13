-- Phone verification.
--
-- The threat this closes is narrow: the order list follows a phone number
-- across sittings, so typing another student's number joins you to their visit
-- and shows you their token numbers — enough to collect their food at the
-- counter. Verification gates that fan-out, and nothing else. Placing an order
-- is never gated, so a telecom outage can never stop the canteen selling food.

-- A code in flight. The code itself is never stored, only an HMAC of it.
create table if not exists phone_challenges (
  id            text primary key,
  phone         text        not null,
  code_hash     text        not null,
  purpose       text        not null check (purpose in ('verify_device', 'recover_session')),
  device_hash   text        not null,
  table_id      text        references dining_tables(id),
  attempts      smallint    not null default 0,
  sends         smallint    not null default 1,
  last_sent_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists phone_challenges_lookup_idx
  on phone_challenges (device_hash, phone, created_at desc);

-- "Do not ask this phone again." This table is the entire reason OTP volume
-- tracks devices rather than orders — a few thousand codes a year instead of
-- tens of thousands, and a returning student never sees one.
create table if not exists verified_phones (
  phone       text        not null,
  device_hash text        not null,
  verified_at timestamptz not null default now(),
  expires_at  timestamptz not null,
  primary key (phone, device_hash)
);

-- The spend ledger. Send limits are counted from here rather than from process
-- memory: the in-memory limiter is per-instance, which is fine when the budget
-- is orders and wrong when the budget is money, because an attacker would
-- multiply the SMS bill by the number of running instances.
create table if not exists otp_sends (
  id       text primary key,
  phone    text        not null,
  ip       text,
  channel  text        not null,
  ok       boolean     not null,
  sent_at  timestamptz not null default now()
);

create index if not exists otp_sends_phone_idx on otp_sends (phone, sent_at desc);
create index if not exists otp_sends_sent_idx  on otp_sends (sent_at desc);

-- Deny by default, like every other table here: the app connects as the owner
-- role and no policy is ever granted to anon or authenticated.
alter table phone_challenges enable row level security;
alter table verified_phones  enable row level security;
alter table otp_sends        enable row level security;

-- Which browser opened this sitting.
--
-- Without this, a student who moves from table 7 to table 12 on one phone
-- loses the earlier sitting from their list until they verify — punishing the
-- honest case the cross-visit fan-out existed for in the first place. The
-- device that actually placed an order is proof enough to keep seeing it, so
-- verification is only needed for a *different* browser: a second phone, or
-- someone typing a number that is not theirs.
alter table visits add column if not exists device_hash text;
create index if not exists visits_device_idx on visits (device_hash, guest_phone);
