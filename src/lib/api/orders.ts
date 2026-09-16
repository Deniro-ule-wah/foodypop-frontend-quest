import { apiRequest } from "./client";
import type { Order } from "./types";

/**
 * VERIFIED (auth-protected): GET /orders, POST /orders, GET /orders/:id,
 * POST /orders/:id/cancel.
 * The exact POST /orders request body is NOT documented by the backend; the
 * client sends the cart payload and surfaces the backend's own validation
 * response verbatim. No contract is invented client-side.
 */

export function listOrders(signal?: AbortSignal) {
  return apiRequest<{ items?: Order[] } | Order[]>("/orders", { auth: true, signal });
}

export function getOrder(id: string, signal?: AbortSignal) {
  return apiRequest<Order>(`/orders/${encodeURIComponent(id)}`, { auth: true, signal });
}

export function createOrder(body: unknown, signal?: AbortSignal) {
  return apiRequest<Order>("/orders", { method: "POST", body, auth: true, signal });
}

export function cancelOrder(id: string, signal?: AbortSignal) {
  return apiRequest<Order>(`/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: {},
    auth: true,
    signal,
  });
}
