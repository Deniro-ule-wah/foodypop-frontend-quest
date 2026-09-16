/**
 * Types describe what the backend MAY return. Every field is optional because
 * the shape of populated records is not yet observable (the environment's
 * discovery collections are currently empty). The UI renders only fields that
 * are actually present — it never manufactures data.
 */

export interface Dish {
  id: string;
  name?: string;
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  images?: string[] | null;
  price?: number | string | null;
  discountPrice?: number | string | null;
  currency?: string | null;
  kind?: string | null;
  type?: string | null;
  isDrink?: boolean | null;
  isCooked?: boolean | null;
  preparation?: string | null;
  ingredients?: string[] | string | null;
  recipe?: string | null;
  availability?: string | null;
  isAvailable?: boolean | null;
  location?: string | null;
  cuisine?: { id?: string; name?: string } | string | null;
  category?: { id?: string; name?: string } | string | null;
  vendor?: Vendor | null;
  vendorId?: string | null;
  tastes?: Record<string, number> | unknown;
  [key: string]: unknown;
}

export interface Vendor {
  id: string;
  name?: string;
  displayName?: string;
  description?: string | null;
  location?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  [key: string]: unknown;
}

export interface Taxonomy {
  id?: string;
  name?: string;
  slug?: string;
  [key: string]: unknown;
}

export const ORDER_STATES = [
  "PENDING_PAYMENT",
  "PAID",
  "PENDING_VENDOR_ACCEPTANCE",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COLLECTED",
  "COMPLETED",
] as const;
export type OrderState = (typeof ORDER_STATES)[number];

/** Payment attempt states. TIMEOUT and UNKNOWN are NON-TERMINAL. */
export const PAYMENT_STATES = ["PENDING", "SUCCESS", "FAILED", "TIMEOUT", "UNKNOWN"] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export const NON_TERMINAL_PAYMENT_STATES: PaymentState[] = ["PENDING", "TIMEOUT", "UNKNOWN"];

export function isTerminalPaymentState(state: string): boolean {
  return state === "SUCCESS" || state === "FAILED";
}

export interface Order {
  id: string;
  status?: string;
  state?: string;
  total?: number | string | null;
  currency?: string | null;
  createdAt?: string;
  items?: Array<Record<string, unknown>>;
  payment?: Record<string, unknown> | null;
  paymentAttempts?: Array<Record<string, unknown>> | null;
  [key: string]: unknown;
}

export interface AuthUser {
  id?: string;
  email?: string;
  displayName?: string;
  [key: string]: unknown;
}
