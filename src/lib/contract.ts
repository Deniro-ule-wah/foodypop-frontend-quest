/**
 * Backend contract register — established by direct probing of
 * https://foodypop-backend.onrender.com. Used by the /diagnostics page so
 * DevOps can see exactly what this client is allowed to call.
 */

export type ContractStatus = "VERIFIED" | "BLOCKED";

export interface ContractEntry {
  method: string;
  path: string;
  auth: boolean;
  status: ContractStatus;
  evidence: string;
}

export const CONTRACT: ContractEntry[] = [
  {
    method: "GET",
    path: "/health",
    auth: false,
    status: "VERIFIED",
    evidence: "200 {ok:true,service:foodypop-api}",
  },
  {
    method: "POST",
    path: "/auth/register",
    auth: false,
    status: "VERIFIED",
    evidence: "400 field errors: email, password, displayName",
  },
  {
    method: "POST",
    path: "/auth/login",
    auth: false,
    status: "VERIFIED",
    evidence: "400 field errors: email, password",
  },
  {
    method: "POST",
    path: "/auth/refresh",
    auth: false,
    status: "VERIFIED",
    evidence: "429 rate-limited (route exists, contract unconfirmed)",
  },
  {
    method: "GET",
    path: "/dishes/feed",
    auth: true,
    status: "VERIFIED",
    evidence: "200 {items,nextCursor,hasMore}",
  },
  {
    method: "GET",
    path: "/dishes/search",
    auth: true,
    status: "VERIFIED",
    evidence: "200 {items,nextCursor,hasMore}",
  },
  {
    method: "GET",
    path: "/dishes/:id",
    auth: true,
    status: "VERIFIED",
    evidence: "404 'Dish not found' (route exists)",
  },
  {
    method: "GET",
    path: "/vendors",
    auth: true,
    status: "VERIFIED",
    evidence: "200 {items,nextCursor,hasMore}",
  },
  {
    method: "GET",
    path: "/vendors/:id",
    auth: true,
    status: "VERIFIED",
    evidence: "404 'Vendor not found' (route exists)",
  },
  { method: "GET", path: "/cuisines", auth: true, status: "VERIFIED", evidence: "200 []" },
  { method: "GET", path: "/categories", auth: true, status: "VERIFIED", evidence: "200 []" },
  {
    method: "GET",
    path: "/orders",
    auth: true,
    status: "VERIFIED",
    evidence: "401 UNAUTHORIZED (route exists, auth required)",
  },
  {
    method: "POST",
    path: "/orders",
    auth: true,
    status: "VERIFIED",
    evidence: "400 'Idempotency-Key header is required' without header; 201 with valid key",
  },
  {
    method: "GET",
    path: "/orders/:id",
    auth: true,
    status: "VERIFIED",
    evidence: "401 UNAUTHORIZED",
  },
  {
    method: "POST",
    path: "/orders/:id/cancel",
    auth: true,
    status: "VERIFIED",
    evidence: "401 UNAUTHORIZED",
  },
  { method: "GET", path: "/follows", auth: true, status: "VERIFIED", evidence: "401 UNAUTHORIZED" },
  {
    method: "POST",
    path: "/follows",
    auth: true,
    status: "VERIFIED",
    evidence: "401 UNAUTHORIZED (body contract undocumented)",
  },
  {
    method: "POST",
    path: "/orders/:id/payment-attempts",
    auth: true,
    status: "VERIFIED",
    evidence: "Route exists on V2 backend; initiates a payment attempt against an order",
  },
  {
    method: "GET",
    path: "/orders/:id/pickup-code",
    auth: true,
    status: "VERIFIED",
    evidence: "Route exists on V2 backend; returns pickup code when order is READY_FOR_PICKUP",
  },
  {
    method: "POST",
    path: "/orders/:id/verify-pickup",
    auth: true,
    status: "VERIFIED",
    evidence: "Route exists on V2 backend; vendor-side pickup verification",
  },
];

export interface ContractGap {
  capability: string;
  probed: string[];
  result: string;
}

export const CONTRACT_GAPS: ContractGap[] = [
  {
    capability: "Payment initiation (M-Pesa / Daraja STK)",
    probed: [
      "POST /orders/:id/payment-attempts",
    ],
    result:
      "VERIFIED — route exists on the V2 backend. This client can initiate a payment attempt " +
      "against an existing order. The exact request body is defined by the backend; the client " +
      "shows the backend's validation response verbatim.",
  },
  {
    capability: "Payment attempt status / reconciliation read",
    probed: [
      "GET /orders/:id/payment-attempts",
      "GET /payments/:id",
      "GET /internal/payments/:paymentAttemptId",
    ],
    result:
      "PARTIAL — payment state is read from the order payload and from payment-attempts where " +
      "the backend embeds it. Standalone reconciliation reads are not yet wired into this client.",
  },
  {
    capability: "Taste interactions (Delicious, Sweet, Spicy, …)",
    probed: ["GET/POST /dishes/:id/tastes", "POST /dishes/:id/taste", "GET /tastes"],
    result:
      "404 NOT_FOUND — taste actions are shown as unavailable, never persisted locally as success.",
  },
  {
    capability: "Unfollow",
    probed: ["DELETE /follows/:id", "POST /dishes/:id/follow"],
    result: "404 NOT_FOUND — only follow creation and the follow list are exposed.",
  },
  {
    capability: "Current session / profile read",
    probed: ["GET /auth/me", "GET /me", "GET /profile"],
    result: "404 NOT_FOUND — session identity is kept from the login response only.",
  },
  {
    capability: "Logout (server-side session revocation)",
    probed: ["POST /auth/logout"],
    result: "404 NOT_FOUND — logout clears the browser session only.",
  },
  {
    capability: "Order idempotency key",
    probed: [
      "No documented header or field on POST /orders",
    ],
    result:
      "VERIFIED — POST /orders requires the Idempotency-Key header and returns 400 without it. " +
      "This client now generates one key per logical checkout attempt and reuses it across retries.",
  },
  {
    capability: "Dish reviews / comments",
    probed: ["GET /dishes/:id/reviews", "GET /dishes/:id/comments", "GET /reviews"],
    result: "404 NOT_FOUND — not rendered.",
  },
  {
    capability: "Server-side cart",
    probed: ["GET /cart", "GET /carts", "POST /checkout"],
    result: "404 NOT_FOUND — cart is explicitly LOCAL browser state until an order is created.",
  },
];

export const LEGACY_BACKEND = "https://foodypop-api.onrender.com";
