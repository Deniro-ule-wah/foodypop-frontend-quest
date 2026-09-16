import { apiRequest, type Paginated } from "./client";
import type { Dish } from "./types";

/** VERIFIED: GET /dishes/feed */
export function getDishFeed(params: { cursor?: string; limit?: number } = {}, signal?: AbortSignal) {
  return apiRequest<Paginated<Dish>>("/dishes/feed", {
    query: { cursor: params.cursor, limit: params.limit },
    auth: true,
    signal,
  });
}

/** VERIFIED: GET /dishes/search */
export function searchDishes(
  params: { q?: string; cursor?: string; limit?: number },
  signal?: AbortSignal,
) {
  return apiRequest<Paginated<Dish>>("/dishes/search", {
    query: { q: params.q, query: params.q, cursor: params.cursor, limit: params.limit },
    auth: true,
    signal,
  });
}

/** VERIFIED: GET /dishes/:id */
export function getDish(id: string, signal?: AbortSignal) {
  return apiRequest<Dish>(`/dishes/${encodeURIComponent(id)}`, { auth: true, signal });
}
