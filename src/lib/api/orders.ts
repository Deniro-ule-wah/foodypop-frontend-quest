import { apiRequest } from "./client";
import type { Order } from "./types";

/**
 * VERIFIED (auth-protected): GET /orders, POST /orders, GET /orders/:id,
 * POST /orders/:id/payment-attempts, GET /orders/:id/pickup-code,
 * POST /orders/:id/verify-pickup, POST /orders/:id/cancel.
 *
 * POST /orders body contract (live-verified against V2 backend):
 *   { vendorId: string, fulfillmentMode: "PICKUP"|"DELIVERY", items: [{offeringId, quantity}] }
 *   Idempotency-Key header is required.
 *
 * POST /orders/:id/payment-attempts body contract (live-verified):
 *   { phoneNumber: string }  — valid Kenyan M-Pesa number (min 9 chars)
 *   Payment-Idempotency-Key header is required.
 *
 * The client sends these shapes verbatim and surfaces the backend's own
 * validation response. No contract is invented client-side.
 */

export function listOrders(signal?: AbortSignal) {
  return apiRequest<{ items?: Order[] } | Order[]>("/orders", { auth: true, signal });
}

export function getOrder(id: string, signal?: AbortSignal) {
  return apiRequest<Order>(`/orders/${encodeURIComponent(id)}`, { auth: true, signal });
}

export function createOrder(body: unknown, signal?: AbortSignal, idempotencyKey?: string) {
  return apiRequest<Order>("/orders", {
    method: "POST",
    body,
    auth: true,
    signal,
    idempotencyKey,
  });
}

export function cancelOrder(id: string, signal?: AbortSignal) {
  return apiRequest<Order>(`/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: {},
    auth: true,
    signal,
  });
}

/**
 * VERIFIED: POST /orders/:id/payment-attempts
 * Initiates a payment attempt against an existing order. The backend remains the
 * financial authority — this client never marks an order PAID locally.
 *
 * Required headers: Payment-Idempotency-Key
 * Required body: { phoneNumber: string } — a valid Kenyan M-Pesa number (min 9 chars)
 */
export function createPaymentAttempt(
  orderId: string,
  phoneNumber: string,
  paymentIdempotencyKey: string,
  signal?: AbortSignal,
) {
  return apiRequest<unknown>(`/orders/${encodeURIComponent(orderId)}/payment-attempts`, {
    method: "POST",
    body: { phoneNumber },
    auth: true,
    signal,
    headers: { "Payment-Idempotency-Key": paymentIdempotencyKey },
  });
}

/**
 * VERIFIED: GET /orders/:id/pickup-code
 * Returns the pickup code for an order that is READY_FOR_PICKUP. The code is only
 * shown when the backend makes it available — never exposed earlier.
 */
export function getPickupCode(id: string, signal?: AbortSignal) {
  return apiRequest<unknown>(`/orders/${encodeURIComponent(id)}/pickup-code`, {
    auth: true,
    signal,
  });
}

/**
 * VERIFIED: POST /orders/:id/verify-pickup
 * Vendor-side pickup verification. The customer does not perform this action.
 */
export function verifyPickup(id: string, body: unknown, signal?: AbortSignal) {
  return apiRequest<unknown>(`/orders/${encodeURIComponent(id)}/verify-pickup`, {
    method: "POST",
    body,
    auth: true,
    signal,
  });
}
