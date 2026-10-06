/**
 * FoodyPop frontend candidate selection — a clearly isolated, rule-based
 * placeholder until the backend exposes a recommendation endpoint.
 * It is NOT AI and NOT a production recommendation engine. Replace
 * `serveNextDish` with a backend call when one exists.
 */
import type { Dish } from "@/lib/api/types";
import { dishEffectivePrice } from "@/lib/cart";
import { dishCategory, dishIsDrink } from "@/lib/taxonomy";
import { demoTaste } from "@/lib/demo/catalog";

export type Intent = "discover" | "hungry" | "thirsty";
export type DishType = "all" | "food" | "drink";

export interface Signals {
  /** Taste label → weight. Positive = user picked it on a dish. */
  tastes: Record<string, number>;
  /** Category name → weight (+ details/vendor opened, − skipped quickly). */
  categories: Record<string, number>;
  seen: string[];
}

export const emptySignals = (): Signals => ({ tastes: {}, categories: {}, seen: [] });

const catName = (d: Dish) => dishCategory(d)?.name ?? "";

export function filterByType(dishes: Dish[], type: DishType, intent: Intent): Dish[] {
  const want: DishType = intent === "thirsty" ? "drink" : intent === "hungry" ? "food" : type;
  if (want === "all") return dishes;
  return dishes.filter((d) => (want === "drink" ? dishIsDrink(d) === true : dishIsDrink(d) !== true));
}

export function scoreCandidates(dishes: Dish[], intent: Intent, s: Signals): Array<{ dish: Dish; score: number }> {
  const prices = dishes.map(dishEffectivePrice).filter((p): p is number => p !== null).sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)]! : null;
  const recentCats = s.seen.slice(-2);
  return dishes.map((dish) => {
    const tastes = demoTaste(dish);
    let score = 1;
    for (const t of tastes) score += (s.tastes[t] ?? 0) * 0.8;
    score += (s.categories[catName(dish)] ?? 0) * 0.5;
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
export function applyNovelty<T extends { dish: Dish }>(scored: T[], s: Signals, currentId?: string | undefined): T[] {
  const notCurrent = scored.filter((c) => c.dish.id !== currentId);
  const fresh = notCurrent.filter((c) => !s.seen.includes(c.dish.id));
  return fresh.length ? fresh : notCurrent.length ? notCurrent : scored;
}

export function weightedRandomSelect<T extends { score: number }>(items: T[], rng: () => number = Math.random): T | null {
  if (!items.length) return null;
  // Controlled randomness: pick among the top half of candidates only.
  const ranked = [...items].sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.ceil(items.length / 2)));
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
  opts: { intent: Intent; type: DishType; signals: Signals; currentId?: string | undefined; rng?: () => number },
): Dish | null {
  const pool = filterByType(all, opts.type, opts.intent);
  const scored = applyNovelty(scoreCandidates(pool, opts.intent, opts.signals), opts.signals, opts.currentId);
  return weightedRandomSelect(scored, opts.rng)?.dish ?? null;
}
