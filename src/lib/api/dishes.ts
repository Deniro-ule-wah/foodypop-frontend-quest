import { apiRequest } from "./client";
import type { Dish } from "./types";

/** Product taste vocabulary. These are the FoodyPop taste gesture types. */
export const TASTES = [
  "Delicious",
  "Sweet",
  "Bitter",
  "Sour",
  "Salty",
  "Spicy",
  "Refreshing",
  "Crispy",
  "Rich",
  "Filling",
] as const;

/** VERIFIED: GET /dishes/feed */
export function getDishFeed(
  params: { cuisines?: string[]; categories?: string[]; cursor?: string; limit?: number } = {},
  signal?: AbortSignal,
) {
  return apiRequest<{ items: Dish[]; nextCursor: string | null; hasMore: boolean }>(
    "/dishes/feed",
    {
      query: {
        limit: params.limit ?? 48,
        cursor: params.cursor,
        // Arrays are sent as comma-separated values; the backend's own filter
        // format is unconfirmed, so nothing else is added to the query.
        cuisines: params.cuisines?.length ? params.cuisines.join(",") : undefined,
        categories: params.categories?.length ? params.categories.join(",") : undefined,
      },
      auth: true,
      signal,
    },
  );
}

/** VERIFIED: GET /dishes/search */
export function searchDishes(
  params: { q?: string; cursor?: string; limit?: number },
  signal?: AbortSignal,
) {
  return apiRequest<{ items: Dish[]; nextCursor: string | null; hasMore: boolean }>(
    "/dishes/search",
    {
      query: { q: params.q, limit: params.limit ?? 24 },
      auth: true,
      signal,
    },
  );
}

/** VERIFIED: GET /dishes/:id */
export function getDish(id: string, signal?: AbortSignal) {
  return apiRequest<Dish>(`/dishes/${encodeURIComponent(id)}`, { auth: true, signal });
}

/**
 * VERIFIED: POST /dishes/:id/gestures
 * React to a dish with a taste gesture type. Returns { ok: true, tasteScore: number }.
 * The backend replaces any previous gesture from this user on this dish.
 */
export function createGesture(dishId: string, type: string, signal?: AbortSignal) {
  return apiRequest<{ ok: boolean; tasteScore: number }>(
    `/dishes/${encodeURIComponent(dishId)}/gestures`,
    { method: "POST", body: { type }, auth: true, signal },
  );
}
