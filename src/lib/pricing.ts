import { db } from "@/lib/store/db";
import type { AddonSnapshot, CartLineInput, Stall } from "@/lib/types";

/**
 * Server-side pricing.
 *
 * The client sends item ids, variant ids, addon ids and quantities — nothing
 * else. Every rupee below is read from the database. Prices, line totals, tax
 * and the order total are never accepted from the request body, because a
 * client that can name its own price can order a ₹250 pizza for ₹1.
 */

export class PricingError extends Error {
  constructor(
    message: string,
    /** Machine-readable so the UI can react (e.g. refresh a sold-out menu). */
    readonly code:
      | "unknown_item"
      | "item_unavailable"
      | "wrong_stall"
      | "invalid_quantity"
      | "unknown_variant"
      | "variant_unavailable"
      | "unknown_addon"
      | "addon_unavailable"
      | "addon_group_rules"
      | "empty_cart",
  ) {
    super(message);
  }
}

/** GST on restaurant service. Only charged by stalls that have a GSTIN. */
const GST_RATE = 0.05;
const MAX_QUANTITY_PER_LINE = 20;

export interface PricedLine {
  itemId: string;
  variantId?: string;
  itemNameSnapshot: string;
  variantNameSnapshot?: string;
  /** Base price plus variant delta plus addon deltas, for one unit. */
  unitPriceSnapshot: number;
  quantity: number;
  addonsSnapshot: AddonSnapshot[];
  lineTotal: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
}

/**
 * Prices a cart against the live menu, validating availability and addon
 * group rules as it goes. Throws PricingError on anything that doesn't add
 * up, so a caller can surface a specific message rather than a generic 400.
 */
export function priceCart(stall: Stall, lines: CartLineInput[]): PricedCart {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new PricingError("Your cart is empty.", "empty_cart");
  }

  const priced: PricedLine[] = lines.map((line) => {
    const item = db.items.find((i) => i.id === line.itemId && i.isActive);
    if (!item) {
      throw new PricingError("One of the items is no longer on the menu.", "unknown_item");
    }
    // A cart belongs to exactly one stall. Reject cross-stall lines outright
    // rather than silently pricing them — mixing stalls in one payment would
    // mean collecting money on another business's behalf.
    if (item.stallId !== stall.id) {
      throw new PricingError(`${item.name} is not sold by ${stall.name}.`, "wrong_stall");
    }
    if (!item.isAvailable) {
      throw new PricingError(`${item.name} is sold out.`, "item_unavailable");
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_LINE) {
      throw new PricingError(`Invalid quantity for ${item.name}.`, "invalid_quantity");
    }

    let unitPrice = item.basePrice;
    let variantNameSnapshot: string | undefined;

    const variantsForItem = db.variants.filter((v) => v.itemId === item.id);
    if (line.variantId) {
      const variant = variantsForItem.find((v) => v.id === line.variantId);
      if (!variant) {
        throw new PricingError(`Invalid option for ${item.name}.`, "unknown_variant");
      }
      if (!variant.isAvailable) {
        throw new PricingError(`${item.name} (${variant.name}) is sold out.`, "variant_unavailable");
      }
      unitPrice += variant.priceDelta;
      variantNameSnapshot = variant.name;
    } else if (variantsForItem.length > 0) {
      throw new PricingError(`Please choose an option for ${item.name}.`, "unknown_variant");
    }

    const addonIds = Array.isArray(line.addonIds) ? line.addonIds : [];
    const addonsSnapshot: AddonSnapshot[] = [];
    const groupsForItem = db.addonGroups.filter((g) => g.itemId === item.id);
    const countByGroup = new Map<string, number>();

    for (const addonId of addonIds) {
      const addon = db.addons.find((a) => a.id === addonId);
      const group = addon ? groupsForItem.find((g) => g.id === addon.groupId) : undefined;
      if (!addon || !group) {
        throw new PricingError(`Invalid choice for ${item.name}.`, "unknown_addon");
      }
      if (!addon.isAvailable) {
        throw new PricingError(`${addon.name} is not available right now.`, "addon_unavailable");
      }
      addonsSnapshot.push({ groupName: group.name, name: addon.name, priceDelta: addon.priceDelta });
      unitPrice += addon.priceDelta;
      countByGroup.set(group.id, (countByGroup.get(group.id) ?? 0) + 1);
    }

    // Enforce min/max per group so a required choice can't be skipped by
    // simply not sending it, and a "pick up to 3" group can't take 10.
    for (const group of groupsForItem) {
      const chosen = countByGroup.get(group.id) ?? 0;
      const min = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
      if (chosen < min) {
        throw new PricingError(`Please choose ${group.name.toLowerCase()} for ${item.name}.`, "addon_group_rules");
      }
      if (group.maxSelect > 0 && chosen > group.maxSelect) {
        throw new PricingError(`Too many choices for ${group.name} on ${item.name}.`, "addon_group_rules");
      }
    }

    return {
      itemId: item.id,
      variantId: line.variantId,
      itemNameSnapshot: item.name,
      variantNameSnapshot,
      unitPriceSnapshot: unitPrice,
      quantity: line.quantity,
      addonsSnapshot,
      lineTotal: unitPrice * line.quantity,
    };
  });

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);
  // Menu prices are what the student pays; GST-registered stalls show the tax
  // broken out of that inclusive price rather than adding it on top.
  const taxAmount = stall.gstin ? Math.round(subtotal - subtotal / (1 + GST_RATE)) : 0;

  return { lines: priced, subtotal, taxAmount, total: subtotal };
}
