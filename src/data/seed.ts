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
    id: "thick-shake",
    name: "The Thick Shake",
    description: "Thick shakes, fruit shakes, cold coffee and falooda.",
    art: "thickshake",
    upiVpa: "thickshake.skcanteen@okaxis",
    upiPayeeName: "The Thick Shake",
    serviceMode: "scheduled",
    isPaused: false,
    // A shake counter sells hardest in the afternoon heat and stays open
    // through the evening, unlike the lunch stalls.
    opensAt: "10:00",
    closesAt: "21:00",
    acceptsCash: true,
    acceptsUpi: true,
    menuLayout: "hero",
    tagline: "Thick shakes, loaded with scoops.",
    tokenPrefix: "TS",
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

  { id: "ts-shakes", stallId: "thick-shake", name: "Thick Shakes", sortOrder: 0, isActive: true },
  { id: "ts-fruit", stallId: "thick-shake", name: "Fruit Shakes", sortOrder: 1, isActive: true },
  { id: "ts-cold", stallId: "thick-shake", name: "Cold Coffee & Falooda", sortOrder: 2, isActive: true },
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

  /* ── The Thick Shake ───────────────────────────────────────────────────── */
  item({ id: "ts-oreo", stallId: "thick-shake", categoryId: "ts-shakes", name: "Oreo Thick Shake", description: "Crushed Oreo blended thick, topped with cream.", basePrice: 110, foodType: "veg", art: "thickshake", sortOrder: 0 }),
  item({ id: "ts-kitkat", stallId: "thick-shake", categoryId: "ts-shakes", name: "KitKat Thick Shake", description: "Blended with KitKat, finished with chocolate sauce.", basePrice: 120, foodType: "veg", art: "thickshake", sortOrder: 1 }),
  item({ id: "ts-belgian", stallId: "thick-shake", categoryId: "ts-shakes", name: "Belgian Chocolate", description: "Dark Belgian chocolate, extra thick.", basePrice: 130, foodType: "veg", art: "thickshake", sortOrder: 2 }),
  item({ id: "ts-butterscotch", stallId: "thick-shake", categoryId: "ts-shakes", name: "Butterscotch Shake", description: "Butterscotch ice cream with praline crunch.", basePrice: 100, foodType: "veg", art: "thickshake", sortOrder: 3 }),
  // Brownie is marked egg, not veg: the food-type mark is regulatory here, not
  // decorative, and a brownie has egg in it.
  item({ id: "ts-brownie", stallId: "thick-shake", categoryId: "ts-shakes", name: "Brownie Thick Shake", description: "Chocolate brownie blended in, served with a scoop.", basePrice: 130, foodType: "egg", art: "thickshake", sortOrder: 4 }),
  item({ id: "ts-mango", stallId: "thick-shake", categoryId: "ts-fruit", name: "Mango Shake", description: "Alphonso pulp, milk and a scoop of vanilla.", basePrice: 90, foodType: "veg", art: "fruitshake", sortOrder: 0 }),
  item({ id: "ts-strawberry", stallId: "thick-shake", categoryId: "ts-fruit", name: "Strawberry Shake", description: "Fresh strawberry with vanilla ice cream.", basePrice: 90, foodType: "veg", art: "fruitshake", sortOrder: 1 }),
  item({ id: "ts-banana", stallId: "thick-shake", categoryId: "ts-fruit", name: "Banana Shake", description: "Thick banana shake, lightly sweetened.", basePrice: 70, foodType: "veg", art: "fruitshake", sortOrder: 2 }),
  item({ id: "ts-chikoo", stallId: "thick-shake", categoryId: "ts-fruit", name: "Chikoo Shake", description: "Sapota blended smooth with chilled milk.", basePrice: 80, foodType: "veg", art: "fruitshake", sortOrder: 3 }),
  item({ id: "ts-cold-coffee", stallId: "thick-shake", categoryId: "ts-cold", name: "Cold Coffee", description: "Blended thick with ice cream.", basePrice: 60, foodType: "veg", art: "icedcoffee", sortOrder: 0 }),
  item({ id: "ts-falooda", stallId: "thick-shake", categoryId: "ts-cold", name: "Royal Falooda", description: "Rose syrup, sev, basil seeds and ice cream.", basePrice: 90, foodType: "veg", art: "falooda", sortOrder: 1 }),
  item({ id: "ts-scoop", stallId: "thick-shake", categoryId: "ts-cold", name: "Ice Cream Scoop", description: "One scoop — vanilla, chocolate or butterscotch.", basePrice: 40, foodType: "veg", art: "icecream", sortOrder: 2 }),
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

  { id: "ts-oreo-reg", itemId: "ts-oreo", name: "Regular", priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "ts-oreo-large", itemId: "ts-oreo", name: "Large", priceDelta: 40, isAvailable: true, sortOrder: 1 },
  { id: "ts-belgian-reg", itemId: "ts-belgian", name: "Regular", priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "ts-belgian-large", itemId: "ts-belgian", name: "Large", priceDelta: 40, isAvailable: true, sortOrder: 1 },
  { id: "ts-mango-reg", itemId: "ts-mango", name: "Regular", priceDelta: 0, isAvailable: true, sortOrder: 0 },
  { id: "ts-mango-large", itemId: "ts-mango", name: "Large", priceDelta: 30, isAvailable: true, sortOrder: 1 },
];

export const SEED_ADDON_GROUPS: ItemAddonGroup[] = [
  { id: "jb-sandwich-extras", itemId: "jb-veg-sandwich", name: "Extras", minSelect: 0, maxSelect: 3, isRequired: false, sortOrder: 0 },
  { id: "jb-vada-spice", itemId: "jb-vada-pav", name: "Spice level", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 0 },
  { id: "tp-maggi-extras", itemId: "tp-veg-maggi", name: "Add extras", minSelect: 0, maxSelect: 3, isRequired: false, sortOrder: 0 },
  { id: "tp-chai-sugar", itemId: "tp-masala-chai", name: "Sugar", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 0 },
  { id: "lp-pizza-toppings", itemId: "lp-margherita", name: "Extra toppings", minSelect: 0, maxSelect: 4, isRequired: false, sortOrder: 0 },
  { id: "lp-farm-toppings", itemId: "lp-farmhouse", name: "Extra toppings", minSelect: 0, maxSelect: 4, isRequired: false, sortOrder: 0 },
  { id: "lp-paneer-toppings", itemId: "lp-paneer-tikka", name: "Extra toppings", minSelect: 0, maxSelect: 4, isRequired: false, sortOrder: 0 },
  { id: "ts-oreo-top", itemId: "ts-oreo", name: "Top it up", minSelect: 0, maxSelect: 3, isRequired: false, sortOrder: 0 },
  { id: "ts-brownie-top", itemId: "ts-brownie", name: "Top it up", minSelect: 0, maxSelect: 3, isRequired: false, sortOrder: 0 },
  { id: "ts-falooda-ice", itemId: "ts-falooda", name: "Ice cream", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 0 },
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

  { id: "ts-ot-scoop", groupId: "ts-oreo-top", name: "Extra scoop", priceDelta: 30, isAvailable: true },
  { id: "ts-ot-choco", groupId: "ts-oreo-top", name: "Chocolate sauce", priceDelta: 15, isAvailable: true },
  { id: "ts-ot-cream", groupId: "ts-oreo-top", name: "Whipped cream", priceDelta: 20, isAvailable: true },
  { id: "ts-bt-scoop", groupId: "ts-brownie-top", name: "Extra scoop", priceDelta: 30, isAvailable: true },
  { id: "ts-bt-nuts", groupId: "ts-brownie-top", name: "Roasted nuts", priceDelta: 20, isAvailable: true },
  { id: "ts-bt-cream", groupId: "ts-brownie-top", name: "Whipped cream", priceDelta: 20, isAvailable: true },
  { id: "ts-fi-vanilla", groupId: "ts-falooda-ice", name: "Vanilla", priceDelta: 0, isAvailable: true },
  { id: "ts-fi-rose", groupId: "ts-falooda-ice", name: "Rose", priceDelta: 0, isAvailable: true },
  { id: "ts-fi-pista", groupId: "ts-falooda-ice", name: "Pista", priceDelta: 10, isAvailable: true },
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
    id: "staff-ts-owner",
    stallId: "thick-shake",
    name: "The Thick Shake Owner",
    phone: "9000000041",
    passwordHash: seedPassword("STALL_PASSWORD", "stall123"),
    role: "stall_owner",
    isActive: true,
  },
];
