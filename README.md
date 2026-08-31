# SK University Canteen — Dine-In Ordering

QR table ordering for the Sakarchand Patel University canteen, across four
independent stalls: **Jay Bhavani**, **Tea Post**, **La Pinos Pizza** and
**Annapurna Tiffin**.

The stalls are separate businesses sharing a room and a set of table QR
codes. They have their own menus, staff, money and UPI accounts, and nothing
is shared between them anywhere in this system.

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

Verified end to end by `npm run build` plus the acceptance harness (51 checks,
all passing) covering:

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

## Note on the fourth stall

`Annapurna Tiffin` is a **placeholder** — the real fourth stall's name wasn't
known at build time. Renaming it is a one-field edit in `src/data/seed.ts`
(change `name` and `upiPayeeName`, leave `id` alone since the menu rows
reference it). Every stall's UPI VPA in the seed is a placeholder too and must
be replaced with the real one before taking a single payment.
