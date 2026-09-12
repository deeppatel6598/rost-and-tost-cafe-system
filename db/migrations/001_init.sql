-- SK University Canteen — initial schema.
--
-- Mirrors src/lib/types.ts one-for-one: camelCase there, snake_case here, so
-- the mapping stays mechanical. Money is stored in whole rupees as integers —
-- the menu has no paise and floating point has no business near a bill.

create table if not exists stalls (
  id              text primary key,
  name            text not null,
  description     text not null default '',
  logo_url        text,
  art             text not null default 'thali',
  upi_vpa         text not null,
  upi_payee_name  text not null,
  gstin           text,
  service_mode    text not null default 'scheduled'
                  check (service_mode in ('scheduled', 'open', 'closed')),
  is_paused       boolean not null default false,
  opens_at        text not null,
  closes_at       text not null,
  accepts_cash    boolean not null default true,
  accepts_upi     boolean not null default true,
  menu_layout     text not null default 'hero'
                  check (menu_layout in ('sidetabs', 'offers', 'hero')),
  tagline         text not null default '',
  token_prefix    text not null,
  -- Bumped inside the order transaction with UPDATE ... RETURNING, which is
  -- what makes two simultaneous orders get two different token numbers.
  token_seq       integer not null default 0,
  sort_order      integer not null default 0
);

create table if not exists menu_categories (
  id          text primary key,
  stall_id    text not null references stalls(id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);
create index if not exists menu_categories_stall_idx on menu_categories(stall_id);

create table if not exists menu_items (
  id            text primary key,
  stall_id      text not null references stalls(id) on delete cascade,
  category_id   text not null references menu_categories(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  base_price    integer not null check (base_price >= 0),
  image_url     text,
  art           text,
  food_type     text not null check (food_type in ('veg', 'non_veg', 'jain', 'egg')),
  is_available  boolean not null default true,
  is_active     boolean not null default true,
  sort_order    integer not null default 0
);
create index if not exists menu_items_stall_idx on menu_items(stall_id);
create index if not exists menu_items_category_idx on menu_items(category_id);

create table if not exists item_variants (
  id            text primary key,
  item_id       text not null references menu_items(id) on delete cascade,
  name          text not null,
  price_delta   integer not null default 0,
  is_available  boolean not null default true,
  sort_order    integer not null default 0
);
create index if not exists item_variants_item_idx on item_variants(item_id);

create table if not exists item_addon_groups (
  id           text primary key,
  item_id      text not null references menu_items(id) on delete cascade,
  name         text not null,
  min_select   integer not null default 0,
  max_select   integer not null default 1,
  is_required  boolean not null default false,
  sort_order   integer not null default 0
);
create index if not exists item_addon_groups_item_idx on item_addon_groups(item_id);

create table if not exists item_addons (
  id            text primary key,
  group_id      text not null references item_addon_groups(id) on delete cascade,
  name          text not null,
  price_delta   integer not null default 0,
  is_available  boolean not null default true
);
create index if not exists item_addons_group_idx on item_addons(group_id);

create table if not exists dining_tables (
  id            text primary key,
  table_number  integer not null unique,
  qr_token      text not null unique,
  is_active     boolean not null default true
);

-- One student's sitting at one table. The phone number is the identity; it is
-- stamped on the first checkout and an order with a different number is a
-- different guest.
create table if not exists visits (
  id                text primary key,
  table_id          text not null references dining_tables(id),
  guest_phone       text,
  opened_at         timestamptz not null default now(),
  last_activity_at  timestamptz not null default now(),
  closed_at         timestamptz,
  closed_reason     text check (closed_reason in ('guest_ended', 'superseded'))
);
-- Backs "my orders": every current visit carrying this number.
create index if not exists visits_phone_active_idx
  on visits(guest_phone, last_activity_at desc)
  where closed_at is null;
create index if not exists visits_table_idx on visits(table_id);

create table if not exists orders (
  id                text primary key,
  public_token      text not null unique,
  table_id          text not null references dining_tables(id),
  visit_id          text not null references visits(id),
  fulfillment_type  text not null default 'dine_in',
  created_at        timestamptz not null default now(),
  guest_phone       text
);
create index if not exists orders_visit_idx on orders(visit_id);

create table if not exists sub_orders (
  id                    text primary key,
  order_id              text not null references orders(id) on delete cascade,
  stall_id              text not null references stalls(id),
  token_number          text not null,
  status                text not null default 'PLACED'
                        check (status in ('PLACED','ACCEPTED','PREPARING','READY','COMPLETED','CANCELLED')),
  payment_method        text not null check (payment_method in ('cash','upi')),
  payment_status        text not null default 'PENDING'
                        check (payment_status in ('PENDING','AWAITING_CONFIRMATION','CONFIRMED','FAILED','REFUND_DUE','REFUNDED')),
  subtotal              integer not null,
  tax_amount            integer not null default 0,
  total                 integer not null,
  upi_reference         text,
  paid_confirmed_by     text,
  paid_confirmed_at     timestamptz,
  special_instructions  text,
  created_at            timestamptz not null default now(),
  accepted_at           timestamptz,
  ready_at              timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  cancel_reason         text,
  refunded_at           timestamptz
);
-- The stall queue is the hottest read in the app.
create index if not exists sub_orders_stall_created_idx on sub_orders(stall_id, created_at desc);
create index if not exists sub_orders_order_idx on sub_orders(order_id);

create table if not exists sub_order_items (
  id                     text primary key,
  sub_order_id           text not null references sub_orders(id) on delete cascade,
  item_id                text not null,
  variant_id             text,
  -- Snapshots are mandatory: yesterday's receipt must not change when a price
  -- changes today.
  item_name_snapshot     text not null,
  variant_name_snapshot  text,
  unit_price_snapshot    integer not null,
  quantity               integer not null check (quantity > 0),
  addons_snapshot        jsonb not null default '[]'::jsonb,
  line_total             integer not null
);
create index if not exists sub_order_items_sub_idx on sub_order_items(sub_order_id);

create table if not exists staff_users (
  id             text primary key,
  stall_id       text references stalls(id) on delete cascade,
  name           text not null,
  phone          text not null unique,
  password_hash  text not null,
  role           text not null check (role in ('stall_staff','stall_owner','super_admin')),
  is_active      boolean not null default true
);

create table if not exists audit_logs (
  id           text primary key,
  actor_id     text not null,
  actor_name   text not null,
  action       text not null,
  entity_type  text not null,
  entity_id    text not null,
  before_json  jsonb,
  after_json   jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs(created_at desc);

-- A double-tap or an offline retry must replay the first order, never create a
-- second. The primary key is the guarantee: a concurrent duplicate loses the
-- insert and reads the winner's row.
create table if not exists idempotency_keys (
  key         text primary key,
  order_id    text not null references orders(id) on delete cascade,
  created_at  timestamptz not null default now()
);
