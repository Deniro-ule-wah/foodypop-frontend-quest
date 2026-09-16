import { apiRequest } from "./client";

/**
 * VERIFIED (auth-protected): GET /follows, POST /follows.
 * NOT EXPOSED (confirmed 404): DELETE /follows/:id, POST /dishes/:id/follow.
 * Unfollow is therefore surfaced as unavailable rather than faked.
 */

export function listFollows(signal?: AbortSignal) {
  return apiRequest<unknown>("/follows", { auth: true, signal });
}

/** Body shape is defined by the backend; its validation errors are shown as-is. */
export function createFollow(body: unknown, signal?: AbortSignal) {
  return apiRequest<unknown>("/follows", { method: "POST", body, auth: true, signal });
}

export const UNFOLLOW_SUPPORTED = false;
