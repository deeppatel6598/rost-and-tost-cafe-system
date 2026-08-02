export type VegMark = "veg" | "nonveg" | "egg";

export type OrderStatus = "received" | "preparing" | "served" | "cancelled";

export interface OptionChoice {
  id: string;
  label: string;
  priceDelta: number;
}

export interface ItemOptionGroup {
  id: string;
  name: string;
  type: "single" | "multi";
  required?: boolean;
  choices: OptionChoice[];
}

export type CategoryIcon =
  | "coffee"
  | "tea"
  | "bakery"
  | "breakfast"
  | "pizza"
  | "plates"
  | "desserts";

export interface Category {
  id: string;
  name: string;
  photoUrl?: string;
  icon: CategoryIcon;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  veg: VegMark;
  photoUrl?: string;
  badge?: string;
  available: boolean;
  optionGroups: ItemOptionGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  label: string;
  priceDelta: number;
}

export interface OrderLine {
  id: string;
  menuItemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  selectedOptions: SelectedOption[];
  lineNote?: string;
  amount: number;
  done: boolean;
}

export interface Order {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  lines: OrderLine[];
  note?: string;
  total: number;
  placedAt: string;
  updatedAt: string;
  servedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  round: number;
}

export type TableStatus = "free" | "occupied";

export interface Table {
  id: string;
  number: number;
  label?: string;
  status: TableStatus;
}

export interface CafeSettings {
  name: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  hours: string;
  rating: number;
  reviewCount: number;
  mapsUrl: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface CartLineInput {
  menuItemId: string;
  qty: number;
  selectedChoiceIds: { groupId: string; choiceId: string }[];
  lineNote?: string;
}

export interface CreateOrderInput {
  tableNumber: number;
  tableToken: string;
  lines: CartLineInput[];
  note?: string;
}
