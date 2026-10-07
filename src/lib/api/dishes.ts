import { apiRequest } from "./client";
import type { Dish } from "./types";
import { demoDish, demoDishes, isDemoId, searchDemo } from "@/lib/demo/catalog";

type Page = { items: Dish[]; nextCursor: string | null; hasMore: boolean };

/** Appends DEMO catalog items (dataMode "DEMO") to a backend page. */
async function withDemo(req: Promise<Page>, demo: Dish[]): Promise<Page> {
  if (demo.length === 0) return req;
  try {
    const page = await req;
    return { ...page, items: [...page.items, ...demo] };
  } catch {
    return { items: demo, nextCursor: null, hasMore: false };
  }
}

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
  const demo = params.cursor ? [] : demoDishes();
  return withDemo(
    apiRequest<Page>("/dishes/feed", {
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
    }),
    demo,
  );
}

/** VERIFIED: GET /dishes/search */
export function searchDishes(
  params: { q?: string; cursor?: string; limit?: number },
  signal?: AbortSignal,
) {
  return withDemo(
    apiRequest<Page>("/dishes/search", {
      query: { q: params.q, limit: params.limit ?? 24 },
      auth: true,
      signal,
    }),
    searchDemo(params.q ?? ""),
  );
}

/** VERIFIED: GET /dishes/:id — demo ids resolve locally, never hit the backend. */
export function getDish(id: string, signal?: AbortSignal) {
  if (isDemoId(id)) {
    const d = demoDish(id);
    if (d) return Promise.resolve(d);
  }
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
