/**
 * FoodyPop frontend candidate selection — a clearly isolated, rule-based
 * placeholder until the backend exposes a recommendation endpoint.
 * It is NOT AI and NOT a production recommendation engine. Replace
 * `serveNextDish` with a backend call when one exists.
 */
import type { Dish } from "@/lib/api/types";
import { dishEffectivePrice } from "@/lib/cart";
import { dishCategory, dishCuisine, dishIsDrink } from "@/lib/taxonomy";
import { demoTaste } from "@/lib/demo/catalog";

export type Intent = "discover" | "hungry" | "thirsty";
export type DishType = "all" | "food" | "drink";

export interface Signals {
  /** Taste label → weight. Positive = user picked it on a dish. */
  tastes: Record<string, number>;
  /** Category name → weight (+ details/vendor opened, − skipped quickly). */
  categories: Record<string, number>;
  seen: string[];
  /** Cuisine name → weight, same rules as categories. */
  cuisines?: Record<string, number>;
  /** Dish id → number of quick skips this session. */
  skipped?: Record<string, number>;
}

export const emptySignals = (): Signals => ({
  tastes: {},
  categories: {},
  seen: [],
  cuisines: {},
  skipped: {},
});

const catName = (d: Dish) => dishCategory(d)?.name ?? "";
const cuisineName = (d: Dish) => dishCuisine(d)?.name ?? "";

/** What the user did with a dish. Simple weighted rules, not machine learning. */
export type Interaction = "quickSkip" | "details" | "vendor" | "taste" | "engagedNext";

/** A skip within this many ms of the dish appearing counts as a quick skip. */
export const QUICK_SKIP_MS = 2000;

export const INTERACTION_WEIGHTS: Record<Interaction, number> = {
  quickSkip: -0.5,
  details: 0.3,
  vendor: 0.3,
  taste: 0.4,
  engagedNext: 0.2,
};

/** Turn one interaction into session signals for the dish's category and cuisine. */
export function recordInteraction(s: Signals, dish: Dish, kind: Interaction): void {
  const w = INTERACTION_WEIGHTS[kind];
  const c = catName(dish);
  const q = cuisineName(dish);
  s.cuisines ??= {};
  s.skipped ??= {};
  if (c) s.categories[c] = (s.categories[c] ?? 0) + w;
  if (q) s.cuisines[q] = (s.cuisines[q] ?? 0) + w;
  if (kind === "quickSkip") s.skipped[dish.id] = (s.skipped[dish.id] ?? 0) + 1;
}

/** Classify leaving a dish: quick skip, engaged next, or plain next. */
export function classifyLeave(ms: number, interacted: boolean): Interaction | null {
  if (interacted) return "engagedNext";
  return ms < QUICK_SKIP_MS ? "quickSkip" : null;
}

/** Dishes the backend explicitly marks unavailable are never served. */
export function filterAvailable(dishes: Dish[]): Dish[] {
  return dishes.filter((d) => d["isAvailable"] !== false);
}

export function filterByType(dishes: Dish[], type: DishType, intent: Intent): Dish[] {
  const want: DishType = intent === "thirsty" ? "drink" : intent === "hungry" ? "food" : type;
  if (want === "all") return dishes;
  return dishes.filter((d) =>
    want === "drink" ? dishIsDrink(d) === true : dishIsDrink(d) !== true,
  );
}

export function scoreCandidates(
  dishes: Dish[],
  intent: Intent,
  s: Signals,
): Array<{ dish: Dish; score: number }> {
  const prices = dishes
    .map(dishEffectivePrice)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)]! : null;
  const recentCats = s.seen.slice(-2);
  return dishes.map((dish) => {
    const tastes = demoTaste(dish);
    let score = 1;
    for (const t of tastes) score += (s.tastes[t] ?? 0) * 0.8;
    score += (s.categories[catName(dish)] ?? 0) * 0.5;
    score += (s.cuisines?.[cuisineName(dish)] ?? 0) * 0.4;
    score -= (s.skipped?.[dish.id] ?? 0) * 1;
    const price = dishEffectivePrice(dish);
    if (intent === "hungry") {
      if (tastes.includes("Filling")) score += 1.5;
      if (price !== null && median !== null && price <= median) score += 1;
    }
    if (intent === "thirsty" && tastes.includes("Refreshing")) score += 1.5;
    if (intent === "discover") {
      // Variety: favour categories not shown in the last few dishes.
      const recent = dishes.filter((d) => recentCats.includes(d.id)).map(catName);
      if (!recent.includes(catName(dish))) score += 1;
    }
    return { dish, score: Math.max(score, 0.1) };
  });
}

/** Unseen dishes first; once everything is seen, start a fresh round. */
export function applyNovelty<T extends { dish: Dish }>(
  scored: T[],
  s: Signals,
  currentId?: string | undefined,
): T[] {
  const notCurrent = scored.filter((c) => c.dish.id !== currentId);
  const fresh = notCurrent.filter((c) => !s.seen.includes(c.dish.id));
  return fresh.length ? fresh : notCurrent.length ? notCurrent : scored;
}

export function weightedRandomSelect<T extends { score: number }>(
  items: T[],
  rng: () => number = Math.random,
): T | null {
  if (!items.length) return null;
  // Controlled randomness: pick among the top half of candidates only.
  const ranked = [...items]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.ceil(items.length / 2)));
  const total = ranked.reduce((n, c) => n + c.score, 0);
  let r = rng() * total;
  for (const c of ranked) {
    r -= c.score;
    if (r <= 0) return c;
  }
  return ranked[ranked.length - 1]!;
}

export function serveNextDish(
  all: Dish[],
  opts: {
    intent: Intent;
    type: DishType;
    signals: Signals;
    currentId?: string | undefined;
    rng?: () => number;
  },
): Dish | null {
  const pool = filterByType(filterAvailable(all), opts.type, opts.intent);
  const scored = applyNovelty(
    scoreCandidates(pool, opts.intent, opts.signals),
    opts.signals,
    opts.currentId,
  );
  return weightedRandomSelect(scored, opts.rng)?.dish ?? null;
}

/** Session-only taste signal. Never touches the backend. */
export function recordTaste(s: Signals, taste: string, on: boolean): void {
  s.tastes[taste] = (s.tastes[taste] ?? 0) + (on ? 1 : -1);
}

/** Only real (non-demo) dishes with a signed-in user may send a taste reaction to FoodyPop. */
export function shouldSendTaste(isDemo: boolean, hasToken: boolean, on: boolean): boolean {
  return on && !isDemo && hasToken;
}

export function markSeen(s: Signals, id: string): void {
  s.seen = [...s.seen.filter((x) => x !== id), id];
}

/**
 * Recommendation boundary. Dish POP talks only to this interface, so a future
 * FoodyPop recommendation service can replace the browser rule engine.
 */
export interface Recommender {
  next(
    all: Dish[],
    opts: { intent: Intent; type: DishType; signals: Signals; currentId?: string | undefined },
  ): Dish | null;
  signal(s: Signals, dish: Dish, kind: Interaction): void;
  taste(s: Signals, taste: string, on: boolean): void;
}

export const browserRecommender: Recommender = {
  next: (all, opts) => serveNextDish(all, opts),
  signal: recordInteraction,
  taste: recordTaste,
};
