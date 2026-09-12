# SK University Canteen — Dine-In Ordering

QR table ordering for the Sakarchand Patel University canteen, across four
independent stalls: **Jay Bhavani**, **Tea Post**, **La Pinos Pizza** and
**The Thick Shake**.

The stalls are separate businesses sharing a room and a set of table QR
codes. They have their own menus, staff, money and UPI accounts, and nothing
is shared between them anywhere in this system.

## Who an order belongs to

An order belongs to a **visit** — one student's sitting at one table — not to
the table itself. A table is furniture: it does not order food and it is still
there when the next student sits down.

**The phone number is the identity.** It is mandatory at checkout, it stamps
the visit on first use, and an order placed with a different number is treated
as a different guest from that moment on. That is what separates two students
at one table without a timer and without asking staff to press anything.

Two consequences worth knowing:

- **Closing the tab is harmless.** The order list is rebuilt server-side from
  the seating cookie, so reopening the site or re-scanning the table code
  brings it back. Browser storage is only a cache now.
- **The list follows the person, not the table.** Food is collected at the
  counter when a token is called, so a student who moves from table 7 to table
  12 keeps every order.

If the cookie is lost as well — cleared storage, a different phone, an in-app
browser — "Find my order" takes the phone number **and** an order token (e.g.
`LP-042`) and is scoped to the table whose code was just scanned. There is
deliberately no way to search by phone number alone.

## The one architectural decision to understand

**A cart belongs to exactly one stall.** A student cannot mix Jay Bhavani and
La Pinos in one cart. After placing an order they tap "Order from another
stall", which keeps the same table session and produces a *second* order with
its own token.

This is deliberate: each stall settles its own money, and combining them in
one payment would mean collecting on another business's behalf, which needs a
licensed payment aggregator. There is no combined cart and no combined
checkout.

The data is nevertheless modelled as `order → sub_orders` even though there is
always exactly one sub-order today. That is what lets a future release add
multi-stall orders without a schema rewrite.

## Surfaces

| Route | Who | What |
|---|---|---|
| `/t/<qr_token>` | student | What the table sticker encodes. Validates the signed token, seats the session, redirects to stall selection. |
| `/order` | student | Stall selection with open / closed / paused state. |
| `/order/<stall>` | student | That stall's menu, cart, customisation sheet. |
| `/order/<stall>/checkout` | student | Cash or UPI choice, instructions, optional phone. |
| `/status/<public_token>` | student | Token number, live status, UPI payment panel, 90s cancel. |
| `/orders` | student | Every order this browser has placed. |
| `/scan` | student | Camera QR scanner, for entering without a direct link. |
| `/admin` | stall staff | Live order queue. |
| `/admin/menu` | stall staff | Menu management, one-tap sold-out toggle. |
| `/admin/today` | stall owner | Sales, split by cash/UPI, top items, hour chart. |
| `/admin/stall` | stall owner | Service mode, hours, cash/UPI, payout details. |
| `/admin/tables` | any staff | Printable table QR codes. |
| `/admin/super` | supervisor | Read-mostly view across all four stalls. |

## Running it

```bash
npm install
cp .env.example .env.local     # set AUTH_SECRET
npm run dev
```

Then sign in at `/admin` as a stall (`9000000031` / `stall123` for La Pinos)
and open **Tables** to get a working table link — the guest flow starts from a
signed QR, so `/order` on its own will send you to the scanner.

Demo logins are printed on the sign-in screen. **Change them before going
live** (`SUPER_ADMIN_PASSWORD`, `STALL_PASSWORD`, or create real accounts as
the supervisor and deactivate the seeds).

## Opening and closing a stall

Each stall has a **service mode**, which is the staff's manual control and
beats the schedule in both directions:

- **Follow my hours** (normal) — opens and closes automatically on
  `opens_at`/`closes_at`.
- **Open now** — keeps serving past the posted closing time.
- **Closed** — shuts immediately, inside its own hours.

**Pause new orders** sits on top of all three: the stall stays open but stops
the queue for a few minutes.

Hours are evaluated in `CANTEEN_TIMEZONE` (default `Asia/Kolkata`), *not* the
server's clock. Hosting runs in UTC, so without this an 11:30am campus lunch
rush reads as 06:00 on the server and every stall shows as closed.

## Payments

There is **no payment gateway**. Money moves directly between the student and
the stall's own UPI account:

- **Cash** — the order goes to the kitchen immediately, `payment_status`
  stays `PENDING`, and is confirmed when the order is marked collected.
- **UPI** — the order is created but **cannot leave `PLACED`** until a member
  of stall staff confirms the money arrived in their own UPI app. The student
  tapping "I have paid" only sets `AWAITING_CONFIRMATION`; it is a claim, and
  the system never treats it as anything else. Unverified claims sit in their
  own "Awaiting payment" section, apart from the cooking queue.

The UPI link is a `upi://pay?...` intent that opens GPay/PhonePe/Paytm with
the amount and token pre-filled. That deep link is the primary path, not the
QR code — the student is ordering *on* their phone, and a phone cannot scan a
QR shown on its own screen. The QR is collapsed below as a fallback for
paying from a second device.

## Order state machine

```
PLACED → ACCEPTED → PREPARING → READY → COMPLETED
   ↓         ↓
CANCELLED  CANCELLED
```

`COMPLETED` requires `payment_status = CONFIRMED` for both methods. Cancelling
an order that was already paid sets `REFUND_DUE`, which surfaces in the stall's
"Needs attention" list and in the supervisor's problem list until marked
`REFUNDED`.

## Security

Verified end to end by `npm run build` plus the acceptance harnesses (88
checks, all passing) covering:

1. **Server-side pricing.** The client sends item, variant and addon **ids and
   quantities only**. Every rupee is recomputed from the database; a client
   total that disagrees is rejected with 409. Injected `basePrice`/`lineTotal`
   fields are ignored outright.
2. **HMAC table tokens.** Stickers encode a signed token, never `?table=12`.
   Forged tokens land on a "we couldn't read that code" page.
3. **Random `public_token`** for status URLs, so nobody can enumerate orders.
4. **Idempotency key** per checkout attempt — a double-tap or an offline retry
   replays the first order rather than creating a second.
5. **Sold-out race** re-checked inside the same synchronous block as the write.
6. **Rate limiting** per table session and per IP, both env-tunable.
7. **Tenancy at the data layer.** Every stall-scoped query goes through one
   choke point that pins staff to their own `stall_id`. Stall A staff get 403
   on stall B's queue and 404 on stall B's menu items.
8. **Short staff sessions** (4h) — these phones get left on counters.
9. **Audit log** on every payment confirmation, refund, cancellation, price
   change and UPI VPA change.
10. **Phone numbers masked** in application logs.
11. Counter staff cannot change the payout VPA; only the stall owner can, and
    it takes a deliberate confirmation step.
12. **The public order link carries no phone number.** Possession of the link
    is the credential, so the response is stripped of anything the link holder
    should not have. Staff read it through the authenticated stall route.
13. **Recovery needs two secrets and physical presence**: the phone number, an
    order token, and a session from that table's printed code. Throttled per
    session and per IP.
14. **Rate limiting is per sitting**, not per table, so two students at one
    table cannot throttle each other.

### One accepted risk

Because the phone number is the identity, someone sitting at the same table who
already knows another student's number could enter it at checkout and be joined
to that student's visit, seeing their recent orders from that table. The blast
radius is one table within four hours. Closing it properly needs SMS OTP, which
is out of scope for this build. It is recorded here rather than left implicit.

## Data — no database yet

Everything lives in a process-local in-memory store (`src/lib/store/`), seeded
from `src/data/seed.ts`. Two consequences:

- On a **single always-on Node server** (`npm run build && npm start`) all four
  stalls and every guest share one consistent view. This is the supported way
  to pilot it.
- On **multi-instance serverless hosting** (Netlify/Vercel Functions) each
  instance keeps its own copy, so an order placed against one instance may not
  appear on another. Do not run the real canteen this way.

### Moving to a real database

Nothing outside `src/lib/store/*.ts` touches the store directly. To add
persistence, reimplement those functions against your database, keeping the
same signatures. Two places need genuine transactions, and both are marked
with comments in `src/lib/store/orders.ts`:

- the idempotency lookup, and
- the sold-out check, which should become a conditional
  `UPDATE ... WHERE is_available = true` rather than read-then-write.

Rate limiting (`src/lib/rate-limit.ts`) also becomes a shared counter.

## Not built (out of scope, by agreement)

Delivery to hostels/departments, guest accounts, payment-gateway integration,
multi-stall single checkout, loyalty, coupons and ratings. The schema does not
block delivery being added later — `fulfillment_type` and the
`order → sub_orders` split are both already in place.

## Before taking a single payment

Every stall's UPI VPA in `src/data/seed.ts` is a placeholder. Replace all four
with the real ones — a wrong VPA sends that stall's takings to a stranger.
Owners can also change their own from the Stall screen, which is audit-logged.

The seeded staff passwords are demo values too (`canteen123`, `stall123`). Set
`SUPER_ADMIN_PASSWORD` and `STALL_PASSWORD` before the first real seed.
