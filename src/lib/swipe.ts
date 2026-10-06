/**
 * Swipe classification for the Dish POP photo. Pure so it can be tested.
 * - Short movements (taps) are ignored.
 * - Diagonal movements are ignored: one axis must clearly dominate.
 * - Slow drags (> 800 ms) are ignored so a resting finger never fires.
 * - Swipe down does nothing (browsers use it for pull-to-refresh).
 */
export type SwipeAction = "next" | "details" | "vendor" | null;

export const SWIPE_MIN_DISTANCE = 50;
export const SWIPE_AXIS_RATIO = 1.5;
export const SWIPE_MAX_MS = 800;

export function classifySwipe(dx: number, dy: number, ms: number): SwipeAction {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ms > SWIPE_MAX_MS) return null;
  if (Math.max(ax, ay) < SWIPE_MIN_DISTANCE) return null;
  if (ay >= ax * SWIPE_AXIS_RATIO) return dy < 0 ? "next" : null;
  if (ax >= ay * SWIPE_AXIS_RATIO) return dx < 0 ? "details" : "vendor";
  return null;
}
