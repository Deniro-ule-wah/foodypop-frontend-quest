import { apiRequest, type Paginated } from "./client";
import type { Taxonomy, Vendor } from "./types";
import { demoCategories, demoVendor, demoVendors, isDemoId } from "@/lib/demo/catalog";

/** VERIFIED: GET /vendors */
export async function listVendors(
  params: { cursor?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<Paginated<Vendor>> {
  const req = apiRequest<Paginated<Vendor>>("/vendors", {
    query: { cursor: params.cursor, limit: params.limit },
    auth: true,
    signal,
  });
  const demo = params.cursor ? [] : demoVendors();
  if (demo.length === 0) return req;
  try {
    const page = await req;
    return { ...page, items: [...page.items, ...demo] };
  } catch {
    return { items: demo, nextCursor: null, hasMore: false };
  }
}

/** VERIFIED: GET /vendors/:id */
export function getVendor(id: string, signal?: AbortSignal) {
  if (isDemoId(id)) {
    const v = demoVendor(id);
    if (v) return Promise.resolve(v as Vendor);
  }
  return apiRequest<Vendor>(`/vendors/${encodeURIComponent(id)}`, { auth: true, signal });
}

/** VERIFIED: GET /cuisines */
export function listCuisines(signal?: AbortSignal) {
  return apiRequest<Taxonomy[]>("/cuisines", { auth: true, signal });
}

/** VERIFIED: GET /categories */
export async function listCategories(signal?: AbortSignal): Promise<Taxonomy[]> {
  const demo = demoCategories();
  try {
    const real = await apiRequest<Taxonomy[]>("/categories", { auth: true, signal });
    return [...(Array.isArray(real) ? real : []), ...demo];
  } catch (e) {
    if (demo.length) return demo;
    throw e;
  }
}
