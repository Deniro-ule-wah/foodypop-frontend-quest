import { describe, expect, it } from "vitest";
import { demoDishes } from "@/lib/demo/catalog";
import {
  browserRecommender,
  classifyLeave,
  emptySignals,
  recordInteraction,
  serveNextDish,
} from "@/lib/recommend";
import { buildMediaList, isVideoUrl } from "@/components/dish-media";
import type { Dish } from "@/lib/api/types";

const all = demoDishes();

describe("skip and engagement signals", () => {
  it("distinguishes quick skip, engaged next and plain next", () => {
    expect(classifyLeave(500, false)).toBe("quickSkip");
    expect(classifyLeave(500, true)).toBe("engagedNext");
    expect(classifyLeave(5000, false)).toBeNull();
  });
  it("quick skips push a dish down after the pool resets", () => {
    const s = emptySignals();
    const target = all[0]!;
    for (let i = 0; i < 4; i++) recordInteraction(s, target, "quickSkip");
    for (const d of all) s.seen.push(d.id);
    let hits = 0;
    for (let i = 0; i < 100; i++)
      if (serveNextDish(all, { intent: "discover", type: "all", signals: s })?.id === target.id)
        hits++;
    expect(hits).toBe(0);
  });
  it("details/vendor/taste raise the dish's category", () => {
    const s = emptySignals();
    const d = all[0]!;
    recordInteraction(s, d, "details");
    recordInteraction(s, d, "taste");
    const total = Object.values(s.categories).reduce((a, b) => a + b, 0);
    const cuis = Object.values(s.cuisines ?? {}).reduce((a, b) => a + b, 0);
    expect(total + cuis).toBeGreaterThan(0);
  });
  it("recommender interface wraps the browser engine", () => {
    expect(
      browserRecommender.next(all, { intent: "hungry", type: "all", signals: emptySignals() }),
    ).not.toBeNull();
  });
});

describe("media capacity", () => {
  it("caps at 5 photos and 2 videos, detects video", () => {
    const d = {
      id: "x",
      images: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"],
      videos: ["a.mp4", "b.webm", "c.mp4"],
    } as unknown as Dish;
    const list = buildMediaList(d);
    expect(list.filter((u) => !isVideoUrl(u))).toHaveLength(5);
    expect(list.filter(isVideoUrl)).toHaveLength(2);
  });
});
