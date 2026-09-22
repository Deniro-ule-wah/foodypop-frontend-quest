/**
 * PAYMENTS — VERIFIED endpoints: POST /orders/:id/payment-attempts.
 *
 * This client:
 *  - does NOT call Daraja directly
 *  - holds NO payment credentials
 *  - NEVER marks an order PAID locally
 *  - NEVER fabricates a SUCCESS payment attempt
 *
 * It initiates payment attempts through the real backend endpoint and renders
 * payment state that the backend itself reports on an order, preserving TIMEOUT
 * and UNKNOWN as non-terminal (verification pending) states.
 */

import type { PaymentState } from "./types";

export const PAYMENT_INITIATION_SUPPORTED = true;

export const PAYMENT_CONTRACT_GAP =
  "Payment initiation is available through POST /orders/:id/payment-attempts on the " +
  "FoodyPop V2 backend. This client initiates attempts against existing orders and " +
  "renders the backend's response verbatim. Backend dependency: a documented payment-" +
  "attempt request body and reconciliation reads (GET /orders/:id/payment-attempts, " +
  "GET /internal/payments/:paymentAttemptId) are not yet wired into this client.";

export function readPaymentState(value: unknown): PaymentState | null {
  const s = typeof value === "string" ? value.toUpperCase() : null;
  if (!s) return null;
  return (["PENDING", "SUCCESS", "FAILED", "TIMEOUT", "UNKNOWN"] as const).includes(
    s as PaymentState,
  )
    ? (s as PaymentState)
    : null;
}

export function paymentStateCopy(state: PaymentState): {
  label: string;
  note: string;
  terminal: boolean;
} {
  switch (state) {
    case "PENDING":
      return {
        label: "Payment being processed",
        note: "Waiting for backend confirmation.",
        terminal: false,
      };
    case "SUCCESS":
      return { label: "Payment confirmed", note: "Confirmed by the backend.", terminal: true };
    case "FAILED":
      return {
        label: "Payment failed",
        note: "The backend recorded a failed attempt.",
        terminal: true,
      };
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
