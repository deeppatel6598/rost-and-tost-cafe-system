import { hashPassword } from "@/lib/password";
import { signTableToken } from "@/lib/table-token";
import type {
  DiningTable,
  ItemAddon,
  ItemAddonGroup,
  ItemVariant,
  MenuCategory,
  MenuItem,
  Stall,
  StaffUser,
} from "@/lib/types";

/**
 * Seed data for the Sakarchand Patel University canteen.
 *
 * The four stalls are independent businesses sharing only the room and the
 * table QR codes — separate menus, separate staff, separate UPI accounts.
 * Nothing here is shared between them.
 */

export const CANTEEN_NAME = "Sakarchand Patel University Canteen";
export const CANTEEN_SHORT_NAME = "SK University Canteen";

export const SEED_STALLS: Stall[] = [
  {
    id: "jay-bhavani",
    name: "Jay Bhavani",
    description: "Vada pav, dabeli and hot sandwiches off the tawa.",
    art: "vadapav",
    upiVpa: "jaybhavani.skcanteen@okaxis",
    upiPayeeName: "Jay Bhavani Fast Food",
    serviceMode: "scheduled",
    isPaused: false,
    opensAt: "08:00",
    closesAt: "20:00",
    acceptsCash: true,
    acceptsUpi: true,
    menuLayout: "sidetabs",
    tagline: "Gujarat\u2019s favourite vada pav, straight off the tawa.",
    tokenPrefix: "JB",
    tokenSeq: 0,
    sortOrder: 0,
  },
  {
    id: "tea-post",
    name: "Tea Post",
    description: "Kadak chai, cold coffee, maggi and bun maska.",
    art: "chai",
    upiVpa: "teapost.skcanteen@okicici",
    upiPayeeName: "Tea Post Canteen",
    serviceMode: "scheduled",
    isPaused: false,
    opensAt: "07:30",
    closesAt: "21:00",
    acceptsCash: true,
    acceptsUpi: true,
    menuLayout: "hero",
    tagline: "Kadak chai and cold coffee, all day long.",
    tokenPrefix: "TP",
    tokenSeq: 0,
    sortOrder: 1,
  },
  {
    id: "la-pinos",
    name: "La Pinos Pizza",
    description: "Hand-tossed pizzas, garlic bread and pasta.",
    art: "pizza",
    upiVpa: "lapinos.skcanteen@oksbi",
    upiPayeeName: "La Pinos Pizza",
    gstin: "24AABCU9603R1ZX",
    serviceMode: "scheduled",
    isPaused: false,
    opensAt: "10:00",
    closesAt: "21:30",
    acceptsCash: true,
    acceptsUpi: true,
    menuLayout: "offers",
    tagline: "Hand-tossed pizza, baked to order.",
    tokenPrefix: "LP",
    tokenSeq: 0,
    sortOrder: 2,
  },
  {
    // PLACEHOLDER: the fourth stall's real name was not known at build time.
    // Renaming it is a one-field edit here (or from the super-admin screen);
    // the id is referenced by its menu rows below, so change `name` and
    // `upiPayeeName`, not `id`.
    id: "annapurna-tiffin",
    name: "Annapurna Tiffin",
    description: "Full Gujarati thali, dal rice and everyday meals.",
    art: "thali",
    upiVpa: "annapurna.skcanteen@okhdfcbank",
    upiPayeeName: "Annapurna Tiffin Service",
    serviceMode: "scheduled",
    isPaused: false,
    opensAt: "11:00",
    closesAt: "16:00",
    acceptsCash: true,
    acceptsUpi: true,
    menuLayout: "hero",
    tagline: "A full ghar-jaisa thali, served hot.",
    tokenPrefix: "AN",
    tokenSeq: 0,
    sortOrder: 3,
  },
];

export const SEED_CATEGORIES: MenuCategory[] = [
  { id: "jb-snacks", stallId: "jay-bhavani", name: "Snacks", sortOrder: 0, isActive: true },
  { id: "jb-sandwiches", stallId: "jay-bhavani", name: "Sandwiches", sortOrder: 1, isActive: true },
  { id: "jb-beverages", stallId: "jay-bhavani", name: "Beverages", sortOrder: 2, isActive: true },

  { id: "tp-chai", stallId: "tea-post", name: "Chai & Coffee", sortOrder: 0, isActive: true },
  { id: "tp-snacks", stallId: "tea-post", name: "Snacks", sortOrder: 1, isActive: true },
  { id: "tp-beverages", stallId: "tea-post", name: "Cold Drinks", sortOrder: 2, isActive: true },

  { id: "lp-pizzas", stallId: "la-pinos", name: "Pizzas", sortOrder: 0, isActive: true },
  { id: "lp-sides", stallId: "la-pinos", name: "Sides & Pasta", sortOrder: 1, isActive: true },
  { id: "lp-beverages", stallId: "la-pinos", name: "Beverages", sortOrder: 2, isActive: true },

  { id: "an-meals", stallId: "annapurna-tiffin", name: "Meals", sortOrder: 0, isActive: true },
  { id: "an-snacks", stallId: "annapurna-tiffin", name: "Snacks", sortOrder: 1, isActive: true },
  { id: "an-beverages", stallId: "annapurna-tiffin", name: "Beverages", sortOrder: 2, isActive: true },
];

function item(
  partial: Omit<MenuItem, "isAvailable" | "isActive"> & { isAvailable?: boolean },
): MenuItem {
  return { isAvailable: true, isActive: true, ...partial };
}

export const SEED_ITEMS: MenuItem[] = [
  /* ── Jay Bhavani ─────────────────────────────────────────────────────── */
  item({ id: "jb-vada-pav", stallId: "jay-bhavani", categoryId: "jb-snacks", name: "Vada Pav", description: "Batata vada in a soft pav with dry garlic chutney.", basePrice: 25, foodType: "veg", art: "vadapav", sortOrder: 0 }),
  item({ id: "jb-dabeli", stallId: "jay-bhavani", categoryId: "jb-snacks", name: "Kutchi Dabeli", description: "Spiced potato, pomegranate and roasted peanuts.", basePrice: 30, foodType: "veg", art: "dabeli", sortOrder: 1 }),
  item({ id: "jb-samosa", stallId: "jay-bhavani", categoryId: "jb-snacks", name: "Samosa", description: "Fried to order, served with hot chutney.", basePrice: 20, foodType: "veg", art: "samosa", sortOrder: 2 }),
  item({ id: "jb-pav-bhaji", stallId: "jay-bhavani", categoryId: "jb-snacks", name: "Pav Bhaji", description: "Butter-loaded bhaji with two toasted pav.", basePrice: 80, foodType: "veg", art: "pavbhaji", sortOrder: 3 }),
  item({ id: "jb-masala-pav", stallId: "jay-bhavani", categoryId: "jb-snacks", name: "Masala Pav", description: "Pav tossed in bhaji masala and butter.", basePrice: 60, foodType: "veg", art: "pavbhaji", sortOrder: 4 }),
  item({ id: "jb-veg-sandwich", stallId: "jay-bhavani", categoryId: "jb-sandwiches", name: "Grilled Veg Sandwich", description: "Cucumber, tomato, potato and chutney, grilled crisp.", basePrice: 60, foodType: "veg", art: "sandwich", sortOrder: 0 }),
  item({ id: "jb-cheese-sandwich", stallId: "jay-bhavani", categoryId: "jb-sandwiches", name: "Cheese Chilli Sandwich", description: "Loaded cheese with green chilli and coriander.", basePrice: 80, foodType: "veg", art: "sandwich", sortOrder: 1 }),
  item({ id: "jb-chaas", stallId: "jay-bhavani", categoryId: "jb-beverages", name: "Masala Chaas", description: "Chilled buttermilk with roasted cumin.", basePrice: 25, foodType: "veg", art: "lassi", sortOrder: 0 }),
  item({ id: "jb-lassi", stallId: "jay-bhavani", categoryId: "jb-beverages", name: "Sweet Lassi", description: "Thick curd lassi topped with malai.", basePrice: 40, foodType: "veg", art: "lassi", sortOrder: 1 }),

  /* ── Tea Post ────────────────────────────────────────────────────────── */
  item({ id: "tp-kadak-chai", stallId: "tea-post", categoryId: "tp-chai", name: "Kadak Chai", description: "Strong, boiled long, the way the counter makes it.", basePrice: 15, foodType: "veg", art: "chai", sortOrder: 0 }),
  item({ id: "tp-masala-chai", stallId: "tea-post", categoryId: "tp-chai", name: "Masala Chai", description: "Ginger, cardamom and clove.", basePrice: 20, foodType: "veg", art: "chai", sortOrder: 1 }),
  item({ id: "tp-green-tea", stallId: "tea-post", categoryId: "tp-chai", name: "Green Tea", description: "Light, with a wedge of lemon.", basePrice: 25, foodType: "veg", art: "greentea", sortOrder: 2 }),
  item({ id: "tp-filter-coffee", stallId: "tea-post", categoryId: "tp-chai", name: "Filter Coffee", description: "South Indian filter decoction with hot milk.", basePrice: 30, foodType: "veg", art: "espresso", sortOrder: 3 }),
  item({ id: "tp-bun-maska", stallId: "tea-post", categoryId: "tp-snacks", name: "Bun Maska", description: "Soft bun, thick slab of butter.", basePrice: 30, foodType: "veg", art: "bunmaska", sortOrder: 0 }),
  item({ id: "tp-khari", stallId: "tea-post", categoryId: "tp-snacks", name: "Khari Biscuit", description: "Flaky puff biscuits, four to a plate.", basePrice: 15, foodType: "veg", art: "bunmaska", sortOrder: 1 }),
  item({ id: "tp-veg-maggi", stallId: "tea-post", categoryId: "tp-snacks", name: "Veg Maggi", description: "Masala maggi with onion, tomato and capsicum.", basePrice: 50, foodType: "veg", art: "maggi", sortOrder: 2 }),
  item({ id: "tp-cheese-maggi", stallId: "tea-post", categoryId: "tp-snacks", name: "Cheese Maggi", description: "Extra cheesy, served in the pan.", basePrice: 70, foodType: "veg", art: "maggi", sortOrder: 3 }),
  item({ id: "tp-cold-coffee", stallId: "tea-post", categoryId: "tp-beverages", name: "Cold Coffee", description: "Blended thick with ice cream.", basePrice: 60, foodType: "veg", art: "icedcoffee", sortOrder: 0 }),
  item({ id: "tp-iced-tea", stallId: "tea-post", categoryId: "tp-beverages", name: "Lemon Iced Tea", description: "Chilled, sharp and not too sweet.", basePrice: 40, foodType: "veg", art: "icedtea", sortOrder: 1 }),

  /* ── La Pinos Pizza ──────────────────────────────────────────────────── */
  item({ id: "lp-margherita", stallId: "la-pinos", categoryId: "lp-pizzas", name: "Margherita", description: "Tomato, mozzarella and basil.", basePrice: 149, foodType: "veg", art: "pizza", sortOrder: 0 }),
  item({ id: "lp-farmhouse", stallId: "la-pinos", categoryId: "lp-pizzas", name: "Farmhouse", description: "Onion, capsicum, corn, tomato and mushroom.", basePrice: 199, foodType: "veg", art: "pizzaveg", sortOrder: 1 }),
  item({ id: "lp-paneer-tikka", stallId: "la-pinos", categoryId: "lp-pizzas", name: "Paneer Tikka Pizza", description: "Tandoori paneer, onion and capsicum.", basePrice: 219, foodType: "veg", art: "pizzapaneer", sortOrder: 2 }),
  item({ id: "lp-chicken-tikka", stallId: "la-pinos", categoryId: "lp-pizzas", name: "Chicken Tikka Pizza", description: "Tandoori chicken, onion and mint mayo drizzle.", basePrice: 249, foodType: "non_veg", art: "pizzachicken", sortOrder: 3 }),
  item({ id: "lp-garlic-bread", stallId: "la-pinos", categoryId: "lp-sides", name: "Garlic Bread", description: "Baked with herb butter.", basePrice: 99, foodType: "veg", art: "garlicbread", sortOrder: 0 }),
  item({ id: "lp-cheesy-garlic-bread", stallId: "la-pinos", categoryId: "lp-sides", name: "Cheesy Garlic Bread", description: "Stuffed with mozzarella, served with dip.", basePrice: 129, foodType: "veg", art: "garlicbread", sortOrder: 1 }),
  item({ id: "lp-white-pasta", stallId: "la-pinos", categoryId: "lp-sides", name: "White Sauce Pasta", description: "Creamy penne with herbs and parmesan.", basePrice: 149, foodType: "veg", art: "pasta", sortOrder: 2 }),
  item({ id: "lp-choco-lava", stallId: "la-pinos", categoryId: "lp-sides", name: "Choco Lava Cake", description: "Warm, with a molten centre.", basePrice: 79, foodType: "egg", art: "brownie", sortOrder: 3 }),
  item({ id: "lp-soft-drink", stallId: "la-pinos", categoryId: "lp-beverages", name: "Soft Drink 500ml", description: "Chilled bottle.", basePrice: 40, foodType: "veg", art: "icedtea", sortOrder: 0 }),

  /* ── Annapurna Tiffin ────────────────────────────────────────────────── */
  item({ id: "an-guj-thali", stallId: "annapurna-tiffin", categoryId: "an-meals", name: "Gujarati Thali", description: "Two sabzi, dal, rice, four rotli, salad and chaas.", basePrice: 120, foodType: "veg", art: "thali", sortOrder: 0 }),
  item({ id: "an-jain-thali", stallId: "annapurna-tiffin", categoryId: "an-meals", name: "Jain Thali", description: "Full thali cooked without onion, garlic or root vegetables.", basePrice: 130, foodType: "jain", art: "thali", sortOrder: 1 }),
  item({ id: "an-dal-rice", stallId: "annapurna-tiffin", categoryId: "an-meals", name: "Dal Rice", description: "Gujarati dal with steamed rice and papad.", basePrice: 70, foodType: "veg", art: "thali", sortOrder: 2 }),
  item({ id: "an-roti-sabzi", stallId: "annapurna-tiffin", categoryId: "an-meals", name: "Roti Sabzi", description: "Four rotli with the sabzi of the day.", basePrice: 80, foodType: "veg", art: "thali", sortOrder: 3 }),
  item({ id: "an-khichdi", stallId: "annapurna-tiffin", categoryId: "an-meals", name: "Khichdi Kadhi", description: "Comfort khichdi with hot kadhi and ghee.", basePrice: 90, foodType: "veg", art: "thali", sortOrder: 4 }),
  item({ id: "an-dhokla", stallId: "annapurna-tiffin", categoryId: "an-snacks", name: "Dhokla", description: "Six pieces, steamed fresh, with tempering.", basePrice: 40, foodType: "veg", art: "dhokla", sortOrder: 0 }),
  item({ id: "an-veg-roll", stallId: "annapurna-tiffin", categoryId: "an-snacks", name: "Veg Frankie Roll", description: "Rotli wrap with masala veg and chutney.", basePrice: 70, foodType: "veg", art: "wrap", sortOrder: 1 }),
  item({ id: "an-buttermilk", stallId: "annapurna-tiffin", categoryId: "an-beverages", name: "Buttermilk", description: "Fresh chaas, lightly salted.", basePrice: 20, foodType: "veg", art: "lassi", sortOrder: 0 }),
];

export const SEED_VARIANTS: ItemVariant[] = [
  { id: "jb-pav-bhaji-half", itemId: "jb-pav-bhaji", name: "Half", priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "jb-pav-bhaji-full", itemId: "jb-pav-bhaji", name: "Full", priceDelta: 40, isAvailable: true, sortOrder: 1 },

  { id: "tp-kadak-regular", itemId: "tp-kadak-chai", name: "Regular", priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "tp-kadak-large", itemId: "tp-kadak-chai", name: "Large", priceDelta: 8, isAvailable: true, sortOrder: 1 },
  { id: "tp-masala-regular", itemId: "tp-masala-chai", name: "Regular", priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "tp-masala-large", itemId: "tp-masala-chai", name: "Large", priceDelta: 10, isAvailable: true, sortOrder: 1 },

  { id: "lp-marg-7", itemId: "lp-margherita", name: '7" Regular', priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "lp-marg-10", itemId: "lp-margherita", name: '10" Medium', priceDelta: 110, isAvailable: true, sortOrder: 1 },
  { id: "lp-marg-12", itemId: "lp-margherita", name: '12" Large', priceDelta: 210, isAvailable: true, sortOrder: 2 },
  { id: "lp-farm-7", itemId: "lp-farmhouse", name: '7" Regular', priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "lp-farm-10", itemId: "lp-farmhouse", name: '10" Medium', priceDelta: 120, isAvailable: true, sortOrder: 1 },
  { id: "lp-farm-12", itemId: "lp-farmhouse", name: '12" Large', priceDelta: 230, isAvailable: true, sortOrder: 2 },
  { id: "lp-paneer-7", itemId: "lp-paneer-tikka", name: '7" Regular', priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "lp-paneer-10", itemId: "lp-paneer-tikka", name: '10" Medium', priceDelta: 130, isAvailable: true, sortOrder: 1 },
  { id: "lp-paneer-12", itemId: "lp-paneer-tikka", name: '12" Large', priceDelta: 250, isAvailable: true, sortOrder: 2 },
  { id: "lp-chick-7", itemId: "lp-chicken-tikka", name: '7" Regular', priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "lp-chick-10", itemId: "lp-chicken-tikka", name: '10" Medium', priceDelta: 140, isAvailable: true, sortOrder: 1 },
  { id: "lp-chick-12", itemId: "lp-chicken-tikka", name: '12" Large', priceDelta: 270, isAvailable: true, sortOrder: 2 },

  { id: "an-thali-regular", itemId: "an-guj-thali", name: "Regular", priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "an-thali-unlimited", itemId: "an-guj-thali", name: "Unlimited", priceDelta: 50, isAvailable: true, sortOrder: 1 },
];

export const SEED_ADDON_GROUPS: ItemAddonGroup[] = [
  { id: "jb-sandwich-extras", itemId: "jb-veg-sandwich", name: "Extras", minSelect: 0, maxSelect: 3, isRequired: false, sortOrder: 0 },
  { id: "jb-vada-spice", itemId: "jb-vada-pav", name: "Spice level", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 0 },
  { id: "tp-maggi-extras", itemId: "tp-veg-maggi", name: "Add extras", minSelect: 0, maxSelect: 3, isRequired: false, sortOrder: 0 },
  { id: "tp-chai-sugar", itemId: "tp-masala-chai", name: "Sugar", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 0 },
  { id: "lp-pizza-toppings", itemId: "lp-margherita", name: "Extra toppings", minSelect: 0, maxSelect: 4, isRequired: false, sortOrder: 0 },
  { id: "lp-farm-toppings", itemId: "lp-farmhouse", name: "Extra toppings", minSelect: 0, maxSelect: 4, isRequired: false, sortOrder: 0 },
  { id: "lp-paneer-toppings", itemId: "lp-paneer-tikka", name: "Extra toppings", minSelect: 0, maxSelect: 4, isRequired: false, sortOrder: 0 },
  { id: "an-thali-pref", itemId: "an-guj-thali", name: "Preferences", minSelect: 0, maxSelect: 2, isRequired: false, sortOrder: 0 },
];

export const SEED_ADDONS: ItemAddon[] = [
  { id: "jb-sx-cheese", groupId: "jb-sandwich-extras", name: "Extra cheese", priceDelta: 20, isAvailable: true },
  { id: "jb-sx-butter", groupId: "jb-sandwich-extras", name: "Extra butter", priceDelta: 10, isAvailable: true },
  { id: "jb-sx-schezwan", groupId: "jb-sandwich-extras", name: "Schezwan spread", priceDelta: 15, isAvailable: true },

  { id: "jb-vs-mild", groupId: "jb-vada-spice", name: "Mild", priceDelta: 0, isAvailable: true },
  { id: "jb-vs-spicy", groupId: "jb-vada-spice", name: "Spicy", priceDelta: 0, isAvailable: true },
  { id: "jb-vs-extra-spicy", groupId: "jb-vada-spice", name: "Extra spicy", priceDelta: 0, isAvailable: true },

  { id: "tp-mx-cheese", groupId: "tp-maggi-extras", name: "Cheese slice", priceDelta: 20, isAvailable: true },
  { id: "tp-mx-veg", groupId: "tp-maggi-extras", name: "Extra vegetables", priceDelta: 15, isAvailable: true },
  { id: "tp-mx-masala", groupId: "tp-maggi-extras", name: "Extra masala", priceDelta: 5, isAvailable: true },

  { id: "tp-cs-normal", groupId: "tp-chai-sugar", name: "Normal sugar", priceDelta: 0, isAvailable: true },
  { id: "tp-cs-less", groupId: "tp-chai-sugar", name: "Less sugar", priceDelta: 0, isAvailable: true },
  { id: "tp-cs-none", groupId: "tp-chai-sugar", name: "No sugar", priceDelta: 0, isAvailable: true },

  { id: "lp-pt-cheese", groupId: "lp-pizza-toppings", name: "Extra cheese", priceDelta: 40, isAvailable: true },
  { id: "lp-pt-jalapeno", groupId: "lp-pizza-toppings", name: "Jalapeños", priceDelta: 25, isAvailable: true },
  { id: "lp-pt-olives", groupId: "lp-pizza-toppings", name: "Black olives", priceDelta: 25, isAvailable: true },
  { id: "lp-pt-paneer", groupId: "lp-pizza-toppings", name: "Paneer", priceDelta: 45, isAvailable: true },

  { id: "lp-ft-cheese", groupId: "lp-farm-toppings", name: "Extra cheese", priceDelta: 40, isAvailable: true },
  { id: "lp-ft-jalapeno", groupId: "lp-farm-toppings", name: "Jalapeños", priceDelta: 25, isAvailable: true },
  { id: "lp-ft-olives", groupId: "lp-farm-toppings", name: "Black olives", priceDelta: 25, isAvailable: true },

  { id: "lp-nt-cheese", groupId: "lp-paneer-toppings", name: "Extra cheese", priceDelta: 40, isAvailable: true },
  { id: "lp-nt-jalapeno", groupId: "lp-paneer-toppings", name: "Jalapeños", priceDelta: 25, isAvailable: true },
  { id: "lp-nt-olives", groupId: "lp-paneer-toppings", name: "Black olives", priceDelta: 25, isAvailable: true },

  { id: "an-tp-nogarlic", groupId: "an-thali-pref", name: "No onion / garlic", priceDelta: 0, isAvailable: true },
  { id: "an-tp-lessoil", groupId: "an-thali-pref", name: "Less oil", priceDelta: 0, isAvailable: true },
];

/** 24 tables in the canteen hall. Each carries its own signed QR sticker. */
export const SEED_TABLES: DiningTable[] = Array.from({ length: 24 }, (_, i) => ({
  id: `table-${i + 1}`,
  tableNumber: i + 1,
  qrToken: signTableToken(i + 1),
  isActive: true,
}));

/**
 * Demo staff accounts. Passwords come from env where set, so a real
 * deployment never ships with these defaults — see .env.example.
 */
function seedPassword(envKey: string, fallback: string): string {
  return hashPassword(process.env[envKey] || fallback);
}

export const SEED_STAFF: StaffUser[] = [
  {
    id: "staff-super",
    stallId: null,
    name: "Canteen Supervisor",
    phone: "9000000001",
    passwordHash: seedPassword("SUPER_ADMIN_PASSWORD", "canteen123"),
    role: "super_admin",
    isActive: true,
  },
  {
    id: "staff-jb-owner",
    stallId: "jay-bhavani",
    name: "Jay Bhavani Owner",
    phone: "9000000011",
    passwordHash: seedPassword("STALL_PASSWORD", "stall123"),
    role: "stall_owner",
    isActive: true,
  },
  {
    id: "staff-jb-counter",
    stallId: "jay-bhavani",
    name: "Jay Bhavani Counter",
    phone: "9000000012",
    passwordHash: seedPassword("STALL_PASSWORD", "stall123"),
    role: "stall_staff",
    isActive: true,
  },
  {
    id: "staff-tp-owner",
    stallId: "tea-post",
    name: "Tea Post Owner",
    phone: "9000000021",
    passwordHash: seedPassword("STALL_PASSWORD", "stall123"),
    role: "stall_owner",
    isActive: true,
  },
  {
    id: "staff-lp-owner",
    stallId: "la-pinos",
    name: "La Pinos Owner",
    phone: "9000000031",
    passwordHash: seedPassword("STALL_PASSWORD", "stall123"),
    role: "stall_owner",
    isActive: true,
  },
  {
    id: "staff-an-owner",
    stallId: "annapurna-tiffin",
    name: "Annapurna Owner",
    phone: "9000000041",
    passwordHash: seedPassword("STALL_PASSWORD", "stall123"),
    role: "stall_owner",
    isActive: true,
  },
];
