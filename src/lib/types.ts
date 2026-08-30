/**
 * SK University Canteen — domain schema.
 *
 * Field names mirror the agreed relational schema (snake_case there,
 * camelCase here) so the eventual migration to a real database is a
 * mechanical mapping rather than a redesign.
 */

export type FoodType = "veg" | "non_veg" | "jain" | "egg";

/** sub_order.status — PLACED → ACCEPTED → PREPARING → READY → COMPLETED, or CANCELLED. */
export type SubOrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethod = "cash" | "upi";

export type PaymentStatus =
  | "PENDING"
  | "AWAITING_CONFIRMATION"
  | "CONFIRMED"
  | "FAILED"
  | "REFUND_DUE"
  | "REFUNDED";

export type StaffRole = "stall_staff" | "stall_owner" | "super_admin";

export type FulfillmentType = "dine_in";

export interface Stall {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  /** Bundled illustration key, used when logoUrl is absent. */
  art: string;
  upiVpa: string;
  upiPayeeName: string;
  gstin?: string;
  /** Master switch. False = closed regardless of the schedule. */
  isOpen: boolean;
  /** Temporarily not taking orders while still "open" (rush, gas out, etc.). */
  isPaused: boolean;
  /** "HH:MM" 24h, campus local time. */
  opensAt: string;
  closesAt: string;
  acceptsCash: boolean;
  acceptsUpi: boolean;
  /** Two-letter prefix for the called-out token, e.g. "LP" → LP-042. */
  tokenPrefix: string;
  /** Per-stall running token counter. Each stall calls its own numbers. */
  tokenSeq: number;
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  stallId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  stallId: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  art?: string;
  foodType: FoodType;
  /** The sold-out toggle. */
  isAvailable: boolean;
  /** Soft delete. */
  isActive: boolean;
  sortOrder: number;
}

export interface ItemVariant {
  id: string;
  itemId: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface ItemAddonGroup {
  id: string;
  itemId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  sortOrder: number;
}

export interface ItemAddon {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface DiningTable {
  id: string;
  tableNumber: number;
  /** HMAC-signed, never a bare table number. */
  qrToken: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  /** Random, used in the public status URL. Never a sequential id. */
  publicToken: string;
  tableId: string;
  fulfillmentType: FulfillmentType;
  createdAt: string;
  guestPhone?: string;
}

export interface SubOrder {
  id: string;
  orderId: string;
  stallId: string;
  /** e.g. "LP-042" — what gets called out. */
  tokenNumber: string;
  status: SubOrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  total: number;
  /** UPI reference the guest typed in, if any. Not trusted, staff still verify. */
  upiReference?: string;
  paidConfirmedBy?: string;
  paidConfirmedAt?: string;
  specialInstructions?: string;
  createdAt: string;
  acceptedAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  refundedAt?: string;
}

export interface AddonSnapshot {
  groupName: string;
  name: string;
  priceDelta: number;
}

export interface SubOrderItem {
  id: string;
  subOrderId: string;
  itemId: string;
  variantId?: string;
  /** Snapshots are mandatory — yesterday's receipts must not change when a price changes today. */
  itemNameSnapshot: string;
  variantNameSnapshot?: string;
  unitPriceSnapshot: number;
  quantity: number;
  addonsSnapshot: AddonSnapshot[];
  lineTotal: number;
}

export interface StaffUser {
  id: string;
  /** null for super_admin — they belong to no single stall. */
  stallId: string | null;
  name: string;
  phone: string;
  passwordHash: string;
  role: StaffRole;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: string;
}

/* ── Request/response shapes ─────────────────────────────────────────────── */

/**
 * What the client is allowed to send when placing an order. Deliberately
 * carries no prices — the server recomputes every rupee from the database.
 */
export interface CartLineInput {
  itemId: string;
  variantId?: string;
  addonIds: string[];
  quantity: number;
}

export interface CreateOrderInput {
  stallId: string;
  lines: CartLineInput[];
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  guestPhone?: string;
  /** Client-computed total, used only as a disagreement check. */
  expectedTotal?: number;
}

/** A sub_order joined with everything a screen needs to render it. */
export interface SubOrderView extends SubOrder {
  items: SubOrderItem[];
  stallName: string;
  stallTokenPrefix: string;
  tableNumber: number;
  publicToken: string;
  guestPhone?: string;
}

/** A menu item with its variants and addon groups resolved. */
export interface MenuItemView extends MenuItem {
  variants: ItemVariant[];
  addonGroups: (ItemAddonGroup & { addons: ItemAddon[] })[];
}

export interface StallAvailability {
  /** True when a guest may place an order right now. */
  canOrder: boolean;
  /** Machine-readable reason when canOrder is false. */
  reason: "open" | "closed" | "paused" | "outside_hours";
  /** Human-readable badge text, e.g. "Opens at 9:00 AM". */
  label: string;
}

export interface StallView extends Stall {
  availability: StallAvailability;
}
