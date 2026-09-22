import { apiRequest } from "./client";

/**
 * VERIFIED (auth-protected): GET /follows, POST /follows, DELETE /follows.
 * Body shape is defined by the backend; its validation errors are shown as-is.
 */

export function listFollows(signal?: AbortSignal) {
  return apiRequest<unknown>("/follows", { auth: true, signal });
}

/** Body shape is defined by the backend; its validation errors are shown as-is. */
export function createFollow(body: unknown, signal?: AbortSignal) {
  return apiRequest<unknown>("/follows", { method: "POST", body, auth: true, signal });
}

/**
 * VERIFIED: DELETE /follows
 * Unfollow a dish, cuisine, or category. Returns 204 No Content.
 * Body shape is identical to POST /follows.
 */
export function deleteFollow(body: unknown, signal?: AbortSignal) {
  return apiRequest<unknown>("/follows", { method: "DELETE", body, auth: true, signal });
}

export const UNFOLLOW_SUPPORTED = true;
