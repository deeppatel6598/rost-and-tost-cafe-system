# Roast and Toast — QR Café Ordering System

One codebase, three surfaces:

- **Public website** (`/`) — the café's face: hero, menu, how table ordering
  works, hours, location, and a contact form.
- **Customer ordering app** (`/order/[tableNumber]`) — what a guest sees after
  scanning the QR code on their table: browse the menu, add items, send the
  order to the kitchen, and watch it move from *Received → Preparing →
  Served*.
- **Admin / Counter panel** (`/admin`) — the staff tool: a live orders board,
  a table grid, a menu manager with an instant sold-out toggle, order
  history, and café settings.

All three talk to the same order and menu data in real time — an order
placed at table 7 shows up on the Counter board within seconds, and marking
it "Preparing" updates the guest's screen on the same loop.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion. No
external UI kit — the design tokens (colours, type, spacing, radius) live in
`src/app/globals.css` and are wired into `tailwind.config.ts`, so `bg-accent`,
`t-display-lg`, etc. all resolve to the café's actual palette.

## Running it locally

```bash
npm install
cp .env.example .env.local   # then edit as needed
npm run dev
```

Open `http://localhost:3000` for the website, `http://localhost:3000/order/7`
to try the guest ordering flow for table 7, and `http://localhost:3000/admin`
for the counter panel (demo login: `admin` / `roastandtoast123`, both
overridable via env vars — change them before you go live).

## About the data — no database yet, on purpose

You asked to ship this live first and connect a real database only once a
client signs off. So right now all data — menu, categories, tables, orders,
café settings, contact messages — lives in a single in-memory store:
`src/lib/store/db.ts`, seeded from `src/data/seed.ts`.

That means:

- Every screen is fully functional today: place an order as a guest, watch
  it appear on the Counter board, advance its status, toggle an item
  sold-out, edit café hours — all of it persists **for as long as the server
  process stays running**.
- Data resets when the server restarts or redeploys, and if you deploy to a
  platform that spins up multiple serverless instances, each instance gets
  its own copy (state won't be shared across them). For an initial live demo
  on a single always-on Node process (e.g. `next start` on a small VPS, or a
  single-instance deployment), this behaves correctly and orders/menu
  changes stay in sync across the site, the guest app, and the counter.

### Connecting a real database later

Nothing outside `src/lib/store/*.ts` talks to the in-memory object directly —
every API route and page goes through the functions in that folder
(`listMenuItems`, `createOrder`, `advanceOrderStatus`, etc.). To add
persistence:

1. Pick a database (Postgres via Prisma/Supabase is a natural fit for this
   shape of data).
2. Reimplement the functions in `src/lib/store/*.ts` against that database,
   keeping the same function names and signatures.
3. Delete `src/lib/store/db.ts` and `src/data/seed.ts` once they're no longer
   imported anywhere.

No API route, page, or component needs to change.

## QR codes for tables

Each table's QR code is generated on the fly at `/api/tables/qr/:number` and
points at `/order/:number` on whichever domain the request actually arrived
on (read from the `host` / `x-forwarded-host` headers) — so it works
correctly on a Netlify preview URL, a custom domain, or localhost with no
configuration needed. Set `NEXT_PUBLIC_SITE_URL` only if you want to pin the
codes to one specific domain regardless of where the request came from.
The Tables tab in the admin panel has a "Download QR" link per table.

**The links are signed.** `/order/7` on its own does nothing — the real
link is `/order/7?t=<signed token>`, where the token is an HMAC of the table
number keyed by `AUTH_SECRET`. This stops a guest from just editing the
number in their address bar and ordering as a table they're not sitting at:
the token is checked both when the ordering page loads and again on the
server when the order is submitted, so bypassing the page and calling the
API directly doesn't work either. Only the printed/downloaded QR code (or
the admin's "Guest view" link) carries a valid token — generating one
requires being signed in as staff (`/api/tables/qr/:number` is
admin-only).

## Environment variables

See `.env.example`:

- `NEXT_PUBLIC_SITE_URL` — your live site URL (used to build QR links).
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — Counter login credentials.
- `AUTH_SECRET` — random string used to sign the admin session cookie
  (`openssl rand -base64 32`).

## Project layout

```
src/
  app/
    page.tsx                 Public website
    order/[tableId]/         Customer QR ordering app
    admin/                   Counter panel (login-protected via middleware.ts)
    api/                     REST-ish API routes backing all three surfaces
  components/
    site/                    Website sections
    order/                   Guest ordering screens (incl. the category carousel)
    admin/                   Counter panel screens
    ui/                      Shared primitives (Button, VegMark, BottomSheet, …)
  lib/
    store/                   In-memory "repository" layer — swap this for a real DB
    types.ts, cart.ts, auth.ts, qrcode.ts, format.ts, api-client.ts
  data/seed.ts                Starting menu, categories, tables, café details
```

## Notes on the guest category carousel

The menu screen's category selector shows three categories at a time (one
centred, two peeking at the edges), drag-to-snap, infinite wrap, and
collapses into a compact strip once the guest scrolls into the item list.
Discoverability of the categories not currently visible is solved with
position dots under the carousel (the smallest, most familiar signal for a
5–10 item set) rather than a peek-count badge or an expand-to-grid control —
see the comment above `CategoryCarousel` in
`src/components/order/CategoryCarousel.tsx` for the reasoning. It respects
`prefers-reduced-motion` (instant snap, no scale/opacity animation) and is
operable by keyboard (arrow keys move & select) with a live region
announcing "*Category name*, category *n* of *total*, selected."
