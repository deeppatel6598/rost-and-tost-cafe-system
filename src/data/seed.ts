import type { CafeSettings, Category, MenuItem, Table } from "@/lib/types";

export const SEED_CATEGORIES: Category[] = [
  { id: "coffee", name: "Coffee", sortOrder: 0, icon: "coffee" },
  { id: "tea", name: "Tea", sortOrder: 1, icon: "tea" },
  { id: "bakery", name: "Bakery", sortOrder: 2, icon: "bakery" },
  { id: "breakfast", name: "Breakfast", sortOrder: 3, icon: "breakfast" },
  { id: "pizza", name: "Pizza", sortOrder: 4, icon: "pizza" },
  { id: "plates", name: "Plates", sortOrder: 5, icon: "plates" },
  { id: "desserts", name: "Desserts", sortOrder: 6, icon: "desserts" },
];

const now = new Date().toISOString();

function item(partial: Omit<MenuItem, "createdAt" | "updatedAt" | "available" | "optionGroups"> & {
  available?: boolean;
  optionGroups?: MenuItem["optionGroups"];
}): MenuItem {
  return {
    available: true,
    optionGroups: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const SIZE_GROUP = (extra = 0) => ({
  id: "size",
  name: "Size",
  type: "single" as const,
  required: true,
  choices: [
    { id: "regular", label: "Regular", priceDelta: 0 },
    { id: "large", label: "Large", priceDelta: extra },
  ],
});

const EXTRA_SHOT_GROUP = {
  id: "add-ons",
  name: "Add-ons",
  type: "multi" as const,
  choices: [{ id: "extra-shot", label: "Extra shot", priceDelta: 40 }],
};

export const SEED_MENU_ITEMS: MenuItem[] = [
  item({
    id: "cortado",
    categoryId: "coffee",
    name: "Cortado",
    description: "Double ristretto, warm milk, no foam to speak of.",
    price: 190,
    veg: "veg",
    optionGroups: [SIZE_GROUP(40), EXTRA_SHOT_GROUP],
  }),
  item({
    id: "pourover",
    categoryId: "coffee",
    name: "Filter pour-over",
    description: "Single origin, changes every fortnight.",
    price: 230,
    veg: "veg",
    optionGroups: [EXTRA_SHOT_GROUP],
  }),
  item({
    id: "tonic",
    categoryId: "coffee",
    name: "Cold brew tonic",
    description: "18-hour cold brew, tonic, orange peel.",
    price: 260,
    veg: "veg",
    optionGroups: [SIZE_GROUP(50)],
  }),
  item({
    id: "frappe",
    categoryId: "coffee",
    name: "Java chip frappe",
    description: "Cold brew, chocolate chip, whipped cream, drizzle.",
    price: 320,
    veg: "veg",
    badge: "Favourite",
    optionGroups: [SIZE_GROUP(50)],
  }),
  item({
    id: "masala-chai",
    categoryId: "tea",
    name: "Masala chai",
    description: "Slow-simmered with ginger, cardamom and clove.",
    price: 120,
    veg: "veg",
    optionGroups: [SIZE_GROUP(30)],
  }),
  item({
    id: "peach-iced-tea",
    categoryId: "tea",
    name: "Iced peach tea",
    description: "Black tea, peach, lemon, served over ice.",
    price: 180,
    veg: "veg",
  }),
  item({
    id: "green-tea",
    categoryId: "tea",
    name: "Jasmine green tea",
    description: "Loose leaf, brewed to order, lightly floral.",
    price: 150,
    veg: "veg",
  }),
  item({
    id: "croissant",
    categoryId: "bakery",
    name: "Almond croissant",
    description: "Two-day laminated dough, frangipane, toasted flakes.",
    price: 210,
    veg: "egg",
  }),
  item({
    id: "roll",
    categoryId: "bakery",
    name: "Cinnamon roll",
    description: "Soft centre, cream cheese glaze while warm.",
    price: 190,
    veg: "egg",
  }),
  item({
    id: "toast",
    categoryId: "bakery",
    name: "Sourdough toast",
    description: "Cultured butter, flaked salt. Add jam for ₹30.",
    price: 180,
    veg: "veg",
    optionGroups: [
      { id: "add-ons", name: "Add-ons", type: "multi", choices: [{ id: "jam", label: "House jam", priceDelta: 30 }] },
    ],
  }),
  item({
    id: "avocado-toast",
    categoryId: "breakfast",
    name: "Avocado toast",
    description: "Smashed avocado, chilli flake, lime, sourdough.",
    price: 290,
    veg: "veg",
    optionGroups: [
      { id: "add-ons", name: "Add-ons", type: "multi", choices: [{ id: "egg", label: "Add a fried egg", priceDelta: 50 }] },
    ],
  }),
  item({
    id: "omelette",
    categoryId: "breakfast",
    name: "Classic omelette",
    description: "Three eggs, herbs, toast on the side.",
    price: 240,
    veg: "egg",
  }),
  item({
    id: "granola-bowl",
    categoryId: "breakfast",
    name: "Granola & yoghurt bowl",
    description: "House granola, seasonal fruit, honey.",
    price: 260,
    veg: "veg",
  }),
  item({
    id: "margherita",
    categoryId: "pizza",
    name: "Margherita pizza",
    description: "San Marzano tomato, fior di latte, basil.",
    price: 380,
    veg: "veg",
    badge: "Favourite",
    optionGroups: [
      { id: "size", name: "Size", type: "single", required: true, choices: [
        { id: "8in", label: '8" personal', priceDelta: 0 },
        { id: "12in", label: '12" regular', priceDelta: 160 },
      ] },
      { id: "add-ons", name: "Add-ons", type: "multi", choices: [
        { id: "extra-cheese", label: "Extra cheese", priceDelta: 60 },
        { id: "no-onion", label: "No onion", priceDelta: 0 },
      ] },
    ],
  }),
  item({
    id: "pesto-pizza",
    categoryId: "pizza",
    name: "Pesto veggie pizza",
    description: "Basil pesto, roasted vegetables, mozzarella.",
    price: 410,
    veg: "veg",
    optionGroups: [
      { id: "size", name: "Size", type: "single", required: true, choices: [
        { id: "8in", label: '8" personal', priceDelta: 0 },
        { id: "12in", label: '12" regular', priceDelta: 160 },
      ] },
    ],
  }),
  item({
    id: "chicken-pizza",
    categoryId: "pizza",
    name: "Chicken pepperoni pizza",
    description: "Smoked chicken pepperoni, mozzarella, oregano oil.",
    price: 440,
    veg: "nonveg",
    optionGroups: [
      { id: "size", name: "Size", type: "single", required: true, choices: [
        { id: "8in", label: '8" personal', priceDelta: 0 },
        { id: "12in", label: '12" regular', priceDelta: 160 },
      ] },
    ],
  }),
  item({
    id: "toastie",
    categoryId: "plates",
    name: "Mushroom toastie",
    description: "Butter-roasted mushrooms, gruyère, sourdough.",
    price: 310,
    veg: "veg",
  }),
  item({
    id: "bao",
    categoryId: "plates",
    name: "Paneer bao",
    description: "Two steamed bao, chilli paneer, pickled onion.",
    price: 330,
    veg: "veg",
    optionGroups: [
      { id: "add-ons", name: "Add-ons", type: "multi", choices: [{ id: "no-onion", label: "No onion", priceDelta: 0 }] },
    ],
  }),
  item({
    id: "pasta",
    categoryId: "plates",
    name: "Pesto pasta",
    description: "Basil pesto, blistered tomato, parmesan.",
    price: 360,
    veg: "veg",
  }),
  item({
    id: "chicken-toastie",
    categoryId: "plates",
    name: "Chicken tikka toastie",
    description: "Tandoori chicken, mint mayo, cheddar, sourdough.",
    price: 350,
    veg: "nonveg",
  }),
  item({
    id: "nachos",
    categoryId: "plates",
    name: "Loaded nachos",
    description: "Corn chips, beans, cheese, jalapeño, sour cream.",
    price: 340,
    veg: "veg",
    available: false,
  }),
  item({
    id: "basque",
    categoryId: "desserts",
    name: "Basque cheesecake",
    description: "Burnt top, barely set middle. One slice per order.",
    price: 280,
    veg: "egg",
    badge: "Limited daily",
  }),
  item({
    id: "brownie",
    categoryId: "desserts",
    name: "Dark chocolate brownie",
    description: "Fudgy centre, walnuts, served warm.",
    price: 220,
    veg: "egg",
    optionGroups: [
      { id: "add-ons", name: "Add-ons", type: "multi", choices: [{ id: "ice-cream", label: "Scoop of vanilla", priceDelta: 70 }] },
    ],
  }),
  item({
    id: "gulab-mousse",
    categoryId: "desserts",
    name: "Gulab jamun mousse",
    description: "Rose and cardamom mousse, crushed pistachio.",
    price: 240,
    veg: "veg",
  }),
];

export const SEED_TABLES: Table[] = Array.from({ length: 14 }, (_, i) => ({
  id: `table-${i + 1}`,
  number: i + 1,
  status: "free",
}));

export const SEED_SETTINGS: CafeSettings = {
  name: "Roast and Toast",
  tagline: "Coffee worth sitting down for.",
  addressLine1: "Synergy Space, Sarkhej–Gandhinagar Highway",
  addressLine2: "Sargasan, Gandhinagar, Gujarat 382419",
  phone: "+919000000000",
  hours: "11:00 AM – 11:00 PM, all seven days",
  rating: 4.7,
  reviewCount: 2000,
  mapsUrl: "https://maps.google.com/?q=Roast+and+Toast+Sargasan+Gandhinagar",
};
