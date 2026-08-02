import type { MenuItem } from "@/lib/types";

export interface CartEntry {
  localId: string;
  menuItemId: string;
  qty: number;
  selectedChoiceIds: { groupId: string; choiceId: string }[];
  lineNote?: string;
}

export function entrySignature(menuItemId: string, selectedChoiceIds: CartEntry["selectedChoiceIds"], lineNote?: string) {
  const sorted = [...selectedChoiceIds].sort((a, b) => a.groupId.localeCompare(b.groupId));
  return `${menuItemId}::${sorted.map((s) => `${s.groupId}=${s.choiceId}`).join(",")}::${lineNote ?? ""}`;
}

export function resolveOptionLabels(item: MenuItem, selectedChoiceIds: CartEntry["selectedChoiceIds"]) {
  return selectedChoiceIds.map(({ groupId, choiceId }) => {
    const group = item.optionGroups.find((g) => g.id === groupId);
    const choice = group?.choices.find((c) => c.id === choiceId);
    return { groupId, label: choice?.label ?? "", priceDelta: choice?.priceDelta ?? 0 };
  });
}

export function entryUnitPrice(item: MenuItem, selectedChoiceIds: CartEntry["selectedChoiceIds"]): number {
  const addOns = resolveOptionLabels(item, selectedChoiceIds).reduce((sum, o) => sum + o.priceDelta, 0);
  return item.price + addOns;
}

export function requiredGroupsSatisfied(item: MenuItem, selectedChoiceIds: CartEntry["selectedChoiceIds"]): boolean {
  return item.optionGroups
    .filter((g) => g.required)
    .every((g) => selectedChoiceIds.some((s) => s.groupId === g.id));
}
