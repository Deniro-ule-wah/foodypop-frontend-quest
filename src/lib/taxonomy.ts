import type { Dish, Taxonomy } from "./api/types";

/**
 * Taxonomy + classification helpers.
 *
 * The backend exposes GET /cuisines and GET /categories (verified) and embeds
 * cuisine / category on dish records. There is NO verified filter parameter on
 * /dishes/feed, so landing pages filter the feed they already fetched and say
 * so on the page. Nothing is inferred beyond fields the backend returns.
 */

export interface TaxonomyRef {
  id: string | null;
  name: string | null;
}

export function taxonomyName(t: Taxonomy): string {
  return (t.name as string) || (t.slug as string) || (t.id as string) || "Unnamed";
}

export function taxonomyId(t: Taxonomy): string {
  return (t.id as string) || (t.slug as string) || taxonomyName(t);
}

function toRef(value: unknown): TaxonomyRef | null {
  if (!value) return null;
  if (typeof value === "string") return { id: null, name: value };
  if (typeof value === "object") {
    const v = value as { id?: string; name?: string; slug?: string };
    const name = v.name ?? v.slug ?? null;
    const id = v.id ?? null;
    if (!name && !id) return null;
    return { id, name };
  }
  return null;
}

export function dishCuisine(dish: Dish): TaxonomyRef | null {
  return toRef(dish.cuisine);
}

export function dishCategory(dish: Dish): TaxonomyRef | null {
  return toRef(dish.category);
}

export function refMatches(ref: TaxonomyRef | null, target: Taxonomy): boolean {
  if (!ref) return false;
  const id = (target.id as string) ?? null;
  const name = (target.name as string) ?? null;
  if (id && ref.id && id === ref.id) return true;
  if (name && ref.name && name.toLowerCase() === ref.name.toLowerCase()) return true;
  return false;
}

/**
 * Drink classification. Returns null when the backend record gives no signal —
 * an unclassified dish is never guessed into a hub.
 */
export function dishIsDrink(dish: Dish): boolean | null {
  if (typeof dish.isDrink === "boolean") return dish.isDrink;
  const labels = [dish.kind, dish.type, dishCategory(dish)?.name]
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.toLowerCase());
  if (labels.length === 0) return null;
  if (labels.some((l) => l.includes("drink") || l.includes("beverage") || l.includes("juice"))) {
    return true;
  }
  if (labels.some((l) => l.includes("food") || l.includes("dish") || l.includes("meal"))) {
    return false;
  }
  return null;
}

export function dishImage(dish: Dish): string | null {
  return (dish.imageUrl as string) || (dish.mediaUrl as string) || dish.images?.[0] || null;
}
