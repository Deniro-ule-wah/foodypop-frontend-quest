/**
 * PAYMENTS — BACKEND CONTRACT UNKNOWN.
 *
 * No payment endpoint could be established on the authoritative backend.
 * Probed and confirmed missing (404): /payments, /payments/initiate,
 * /payments/stk-push, /payments/mpesa*, /orders/:id/pay, /orders/:id/payments,
 * /payment-attempts.
 *
 * Therefore this client:
 *  - does NOT call Daraja directly
 *  - holds NO payment credentials
 *  - NEVER marks an order PAID locally
 *  - NEVER fabricates a SUCCESS payment attempt
 *
 * It only renders payment state that the backend itself reports on an order,
 * preserving TIMEOUT and UNKNOWN as non-terminal (verification pending) states.
 */

import type { PaymentState } from "./types";

export const PAYMENT_INITIATION_SUPPORTED = false;

export const PAYMENT_CONTRACT_GAP =
  "Payment initiation is not exposed by the FoodyPop V2 backend at this deployment. " +
  "This client will not simulate it. Backend dependency: a verified payment-initiation " +
  "and payment-status endpoint.";

export function readPaymentState(value: unknown): PaymentState | null {
  const s = typeof value === "string" ? value.toUpperCase() : null;
  if (!s) return null;
  return (["PENDING", "SUCCESS", "FAILED", "TIMEOUT", "UNKNOWN"] as const).includes(s as PaymentState)
    ? (s as PaymentState)
    : null;
}

export function paymentStateCopy(state: PaymentState): { label: string; note: string; terminal: boolean } {
  switch (state) {
    case "PENDING":
      return { label: "Payment being processed", note: "Waiting for backend confirmation.", terminal: false };
    case "SUCCESS":
      return { label: "Payment confirmed", note: "Confirmed by the backend.", terminal: true };
    case "FAILED":
      return { label: "Payment failed", note: "The backend recorded a failed attempt.", terminal: true };
    case "TIMEOUT":
      return {
        label: "Payment timed out",
        note: "Not a final result — verification may still be pending on the backend.",
        terminal: false,
      };
    case "UNKNOWN":
      return {
        label: "Payment status unknown",
        note: "Not a final result — the backend must verify this attempt.",
        terminal: false,
      };
  }
}
