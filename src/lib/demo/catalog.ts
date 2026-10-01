/**
 * FoodyPop DEMO catalog — dataMode: "DEMO".
 *
 * One canonical source for demo vendors, dishes, taste profiles and sample
 * reviews. NOT production data: vendors are fictional, prices are illustrative,
 * reviews are sample text. Demo ids start with "demo-" so they can never be
 * confused with backend ids, and they are never sent to the backend.
 *
 * Image mapping (explicit, from supplied files):
 *   DISH-01 Classic_Cheeseburger_-_Hero_close-up.jpg
 *   DISH-02 Nyama_Choma_-_Authentic_Kenyan_street-food_style.jpg
 *   DISH-03 Pepperoni_Pizza_-_Top-down_restaurant_presentation.jpg
 *   DISH-04 (no image supplied — shows the empty-media state)
 *   DISH-05 Loaded_Fries_-_Casual_takeaway_style.jpg
 *   DISH-06 Crispy_Chicken_Wings_-_Close-up_hero.jpg
 *   DISH-07 Chicken_Shawarma_Wrap_-_Street-food_style.jpg
 *   DISH-08 Fluffy_Pancakes_with_Berries_-_Café_breakfast.jpg
 *   DISH-09 Beef_Pilau_-_KenyanEast_African_rice_dish.jpg
 *   DISH-10 Chocolate_Brownie_with_Ice_Cream_-_Dessert_close-up.jpg
 */
import img01 from "@/assets/demo/dish-01.jpg.asset.json";
import img02 from "@/assets/demo/dish-02.jpg.asset.json";
import img03 from "@/assets/demo/dish-03.jpg.asset.json";
import img05 from "@/assets/demo/dish-05.jpg.asset.json";
import img06 from "@/assets/demo/dish-06.jpg.asset.json";
import img07 from "@/assets/demo/dish-07.jpg.asset.json";
import img08 from "@/assets/demo/dish-08.jpg.asset.json";
import img09 from "@/assets/demo/dish-09.jpg.asset.json";
import img10 from "@/assets/demo/dish-10.jpg.asset.json";
import type { Dish, Taxonomy, Vendor } from "@/lib/api/types";

export const DATA_MODE = "DEMO" as const;
export const DEMO_ENABLED = import.meta.env["VITE_DEMO_CATALOG"] !== "false";

export interface DemoVendor extends Vendor {
  dataMode: "DEMO";
  category: string;
  tagline: string;
  hours: string;
  fulfillment: string[];
}

export interface DemoReview {
  text: string;
  stars: number;
}

interface DishSeed {
  code: string;
  name: string;
  vendor: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  taste: string[];
  cta: string;
  image: string | null;
  reviews: DemoReview[];
}

const VENDORS: DemoVendor[] = [
  {
    id: "demo-ven-01",
    dataMode: "DEMO",
    name: "Nairobi Grill House",
    category: "Grill / Local kitchen",
    tagline: "Real fire. Real Kenyan flavour.",
    description: "Open-flame specialists serving classic Kenyan grilled meats and staples.",
    location: "Westlands, Nairobi",
    hours: "Mon–Sun 11:00–22:00",
    fulfillment: ["Pickup", "Delivery"],
  },
  {
    id: "demo-ven-02",
    dataMode: "DEMO",
    name: "Burger Lab KE",
    category: "Fast-food outlet / Grill",
    tagline: "Juicy. Crispy. Loaded.",
    description:
      "Modern Kenyan take on American grill favourites — burgers, loaded fries and crispy wings.",
    location: "Kilimani, Nairobi",
    hours: "Mon–Sun 10:00–23:00",
    fulfillment: ["Pickup", "Delivery"],
  },
  {
    id: "demo-ven-03",
    dataMode: "DEMO",
    name: "Slice & Wrap Co.",
    category: "Fast-casual",
    tagline: "Dough done right.",
    description: "Freshly made pizza and shawarma wraps with generous fillings and crisp finishes.",
    location: "Lavington, Nairobi",
    hours: "Tue–Sun 11:00–21:30",
    fulfillment: ["Pickup", "Delivery"],
  },
  {
    id: "demo-ven-04",
    dataMode: "DEMO",
    name: "Bloom Café",
    category: "Cafe / Bakery",
    tagline: "Sweet starts and soft finishes.",
    description:
      "Daytime café specialising in fluffy pancakes, rich brownies and simple dessert plates.",
    location: "Karen, Nairobi",
    hours: "Mon–Sat 08:00–18:00, Sun 09:00–16:00",
    fulfillment: ["Pickup", "Limited delivery"],
  },
];

const SEEDS: DishSeed[] = [
  { code: "01", name: "Classic Cheeseburger", vendor: "02", category: "Burger", price: 550,
    description: "Thick seared beef patty under melted cheese, layered with lettuce, tomato, pickle chips and house sauce in a soft sesame bun.",
    tags: ["Burger", "Cheesy", "Grilled", "Classic"], taste: ["Delicious", "Salty", "Rich", "Filling"],
    cta: "Order this burger", image: img01.url,
    reviews: [{ text: "The cheese pull alone made me order again.", stars: 5 }, { text: "Solid burger, good portion for the price.", stars: 4 }] },
  { code: "02", name: "Nyama Choma", vendor: "01", category: "Grilled Meat", price: 850,
    description: "Bone-in cuts grilled over open flame until charred outside and juicy inside, served with fresh tomato-onion kachumbari.",
    tags: ["Grilled", "Kenyan", "Smoky", "Meat"], taste: ["Delicious", "Salty", "Rich", "Filling"],
    cta: "Get the nyama", image: img02.url,
    reviews: [{ text: "Proper charcoal taste, just how nyama should be.", stars: 5 }, { text: "Generous plate, kachumbari was fresh.", stars: 4 }] },
  { code: "03", name: "Pepperoni Pizza", vendor: "03", category: "Pizza", price: 950,
    description: "Golden crust topped with melted cheese, pepperoni and fresh basil.",
    tags: ["Pizza", "Cheesy", "Spicy", "Shareable"], taste: ["Delicious", "Salty", "Crispy", "Rich"],
    cta: "Order the pizza", image: img03.url,
    reviews: [{ text: "Crust was crispy and the pepperoni had the right spice.", stars: 5 }, { text: "Good for sharing, cheese was stretchy.", stars: 4 }] },
  { code: "04", name: "Ugali na Sukuma Wiki", vendor: "01", category: "Kenyan Staple", price: 350,
    description: "Soft ugali served with cooked leafy greens and stewed meat.",
    tags: ["Kenyan", "Staple", "Filling", "Traditional"], taste: ["Delicious", "Filling", "Salty"],
    cta: "Order the plate", image: null,
    reviews: [{ text: "Tastes like home — soft ugali and well-cooked greens.", stars: 5 }, { text: "Filling plate, good everyday meal.", stars: 4 }] },
  { code: "05", name: "Loaded Fries", vendor: "02", category: "Sides", price: 450,
    description: "Golden fries loaded with melted cheese, crispy bacon bits and chopped green onions.",
    tags: ["Fries", "Cheesy", "Loaded", "Crispy"], taste: ["Delicious", "Salty", "Crispy", "Rich"],
    cta: "Add the fries", image: img05.url,
    reviews: [{ text: "Cheese and bacon everywhere — dangerous in the best way.", stars: 5 }, { text: "Crispy fries held up under the toppings.", stars: 4 }] },
  { code: "06", name: "Crispy Chicken Wings", vendor: "02", category: "Fried Chicken", price: 650,
    description: "Golden crispy chicken wings served with a creamy dipping sauce.",
    tags: ["Wings", "Crispy", "Fried", "Chicken"], taste: ["Delicious", "Crispy", "Salty"],
    cta: "Order the wings", image: img06.url,
    reviews: [{ text: "Crunch was perfect, sauce cooled it down nicely.", stars: 5 }, { text: "Good size portion of wings.", stars: 4 }] },
  { code: "07", name: "Chicken Shawarma Wrap", vendor: "03", category: "Wrap", price: 400,
    description: "Grilled chicken, lettuce, tomato, red onion and creamy sauce wrapped in soft flatbread.",
    tags: ["Wrap", "Shawarma", "Grilled", "Handheld"], taste: ["Delicious", "Salty", "Filling"],
    cta: "Grab the wrap", image: img07.url,
    reviews: [{ text: "Chicken was juicy and the sauce was creamy.", stars: 5 }, { text: "Fresh veg made it feel light.", stars: 4 }] },
  { code: "08", name: "Berry Pancakes", vendor: "04", category: "Breakfast", price: 520,
    description: "Fluffy pancakes topped with butter, syrup, fresh berries and powdered sugar.",
    tags: ["Pancakes", "Sweet", "Breakfast", "Berries"], taste: ["Delicious", "Sweet", "Rich"],
    cta: "Order breakfast", image: img08.url,
    reviews: [{ text: "Fluffy and the berries were actually fresh.", stars: 5 }, { text: "Perfect weekend breakfast.", stars: 4 }] },
  { code: "09", name: "Beef Pilau", vendor: "01", category: "Rice", price: 480,
    description: "Fragrant spiced rice with tender beef and fresh kachumbari.",
    tags: ["Pilau", "Kenyan", "Spiced", "Rice"], taste: ["Delicious", "Salty", "Rich", "Filling"],
    cta: "Order the pilau", image: img09.url,
    reviews: [{ text: "Spices came through clearly, beef was tender.", stars: 5 }, { text: "Proper pilau portion.", stars: 4 }] },
  { code: "10", name: "Chocolate Brownie Sundae", vendor: "04", category: "Dessert", price: 480,
    description: "Warm fudgy brownie topped with vanilla ice cream, chocolate drizzle and fresh berries.",
    tags: ["Dessert", "Chocolate", "Sweet", "Warm"], taste: ["Delicious", "Sweet", "Rich"],
    cta: "Treat yourself", image: img10.url,
    reviews: [{ text: "Warm brownie + cold ice cream is unbeatable.", stars: 5 }, { text: "Rich without being too heavy.", stars: 4 }] },
];

const vendorById = new Map(VENDORS.map((v) => [v.id, v]));

const DISHES: Dish[] = SEEDS.map((s): Dish => {
  const vendor = vendorById.get(`demo-ven-${s.vendor}`)!;
  const catId = `demo-cat-${s.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return {
    id: `demo-dish-${s.code}`,
    dataMode: DATA_MODE,
    name: s.name,
    description: s.description,
    imageUrl: s.image,
    price: s.price,
    currency: "KES",
    kind: "FOOD",
    isDrink: false,
    category: { id: catId, name: s.category },
    vendor: { id: vendor.id, name: vendor.name as string },
    vendorId: vendor.id,
    demoTags: s.tags,
    demoTaste: s.taste,
    demoCta: s.cta,
    demoReviews: s.reviews,
    demoFulfillment: vendor.fulfillment,
  };
});

export const mockCatalog = {
  dataMode: DATA_MODE,
  vendors: VENDORS,
  dishes: DISHES,
  tasteProfiles: Object.fromEntries(SEEDS.map((s) => [`demo-dish-${s.code}`, s.taste])),
  sampleReviews: Object.fromEntries(SEEDS.map((s) => [`demo-dish-${s.code}`, s.reviews])),
} as const;

export function isDemoId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith("demo-");
}

export function isDemoDish(dish: Dish | null | undefined): boolean {
  return !!dish && dish["dataMode"] === DATA_MODE;
}

export function demoDishes(): Dish[] {
  return DEMO_ENABLED ? DISHES : [];
}

export function demoVendors(): DemoVendor[] {
  return DEMO_ENABLED ? VENDORS : [];
}

export function demoDish(id: string): Dish | null {
  return DEMO_ENABLED ? (DISHES.find((d) => d.id === id) ?? null) : null;
}

export function demoVendor(id: string): DemoVendor | null {
  return DEMO_ENABLED ? (vendorById.get(id) ?? null) : null;
}

export function demoDishesForVendor(vendorId: string): Dish[] {
  return demoDishes().filter((d) => d.vendorId === vendorId);
}

export function demoCategories(): Taxonomy[] {
  const seen = new Map<string, Taxonomy>();
  for (const d of demoDishes()) {
    const c = d.category as { id: string; name: string };
    if (!seen.has(c.id)) seen.set(c.id, { id: c.id, name: c.name, dataMode: DATA_MODE });
  }
  return [...seen.values()];
}

/** Text search over name, description, tags, category and vendor. */
export function searchDemo(q: string): Dish[] {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return demoDishes().filter((d) => {
    const hay = [
      d.name,
      d.description,
      (d.category as { name: string }).name,
      d.vendor?.name,
      ...((d["demoTags"] as string[]) ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(term);
  });
}

export function demoTaste(dish: Dish): string[] {
  return (dish["demoTaste"] as string[] | undefined) ?? [];
}
export function demoTags(dish: Dish): string[] {
  return (dish["demoTags"] as string[] | undefined) ?? [];
}
export function demoReviews(dish: Dish): DemoReview[] {
  return (dish["demoReviews"] as DemoReview[] | undefined) ?? [];
}
