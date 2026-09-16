import { apiRequest, type Paginated } from "./client";
import type { Taxonomy, Vendor } from "./types";

/** VERIFIED: GET /vendors */
export function listVendors(params: { cursor?: string; limit?: number } = {}, signal?: AbortSignal) {
  return apiRequest<Paginated<Vendor>>("/vendors", {
    query: { cursor: params.cursor, limit: params.limit },
    auth: true,
    signal,
  });
}

/** VERIFIED: GET /vendors/:id */
export function getVendor(id: string, signal?: AbortSignal) {
  return apiRequest<Vendor>(`/vendors/${encodeURIComponent(id)}`, { auth: true, signal });
}

/** VERIFIED: GET /cuisines */
export function listCuisines(signal?: AbortSignal) {
  return apiRequest<Taxonomy[]>("/cuisines", { auth: true, signal });
}

/** VERIFIED: GET /categories */
export function listCategories(signal?: AbortSignal) {
  return apiRequest<Taxonomy[]>("/categories", { auth: true, signal });
}
