import { describe, expect, it } from "vitest";
import { demoDishes, demoTaste } from "@/lib/demo/catalog";
import { emptySignals, serveNextDish } from "@/lib/recommend";

describe("frontend candidate selection", () => {
  const all = demoDishes();
  it("hungry serves food and never repeats until all seen", () => {
    const s = emptySignals();
    const seen = new Set<string>();
    let cur: string | undefined;
    for (let i = 0; i < all.length; i++) {
      const d = serveNextDish(all, { intent: "hungry", type: "all", signals: s, currentId: cur })!;
      expect(seen.has(d.id)).toBe(false);
      seen.add(d.id);
      s.seen.push(d.id);
      cur = d.id;
    }
  });
  it("thirsty with no drinks returns null", () => {
    expect(
      serveNextDish(all, { intent: "thirsty", type: "all", signals: emptySignals() }),
    ).toBeNull();
  });
  it("taste picks steer selection", () => {
    const s = emptySignals();
    s.tastes["Sweet"] = 5;
    let sweet = 0;
    for (let i = 0; i < 200; i++) {
      const d = serveNextDish(all, { intent: "discover", type: "all", signals: s })!;
      if (demoTaste(d).includes("Sweet")) sweet++;
    }
    expect(sweet).toBeGreaterThan(100);
  });
  it("is not a fixed sequence", () => {
    const ids = new Set(
      Array.from(
        { length: 30 },
        () => serveNextDish(all, { intent: "discover", type: "all", signals: emptySignals() })!.id,
      ),
    );
    expect(ids.size).toBeGreaterThan(1);
  });
});

import { classifySwipe } from "@/lib/swipe";
import { filterByType, recordTaste, shouldSendTaste, markSeen } from "@/lib/recommend";
import type { Dish } from "@/lib/api/types";

const drink = { id: "d1", name: "Juice", isDrink: true, kind: "DRINK" } as Dish;
const food = { id: "f1", name: "Rice", isDrink: false, kind: "FOOD" } as Dish;

const all = demoDishes();

describe("intents and type", () => {
  it("Discover food / drink / both", () => {
    expect(filterByType([drink, food], "food", "discover")).toEqual([food]);
    expect(filterByType([drink, food], "drink", "discover")).toEqual([drink]);
    expect(filterByType([drink, food], "all", "discover")).toHaveLength(2);
  });
  it("Hungry is food only, Thirsty is drinks only", () => {
    expect(filterByType([drink, food], "all", "hungry")).toEqual([food]);
    expect(filterByType([drink, food], "all", "thirsty")).toEqual([drink]);
  });
  it("never serves a dish the backend marks unavailable", () => {
    const off = { ...food, id: "f2", isAvailable: false } as Dish;
    for (let i = 0; i < 20; i++)
      expect(
        serveNextDish([off, food], { intent: "hungry", type: "all", signals: emptySignals() })?.id,
      ).toBe("f1");
  });
  it("pool resets after every dish was seen", () => {
    const s = emptySignals();
    for (const d of all) markSeen(s, d.id);
    expect(serveNextDish(all, { intent: "discover", type: "all", signals: s })).not.toBeNull();
  });
  it("randomness stays inside the stronger half of candidates", () => {
    const s = emptySignals();
    s.tastes["Sweet"] = 10;
    const sweetOnly = new Set(all.filter((d) => demoTaste(d).includes("Sweet")).map((d) => d.id));
    for (let i = 0; i < 50; i++) {
      const id = serveNextDish(all, {
        intent: "discover",
        type: "all",
        signals: s,
        rng: () => Math.random() * 0.2,
      })!.id;
      expect(sweetOnly.has(id)).toBe(true);
    }
  });
});

describe("taste safety", () => {
  it("demo taste picks stay in the session and are never sent", () => {
    expect(shouldSendTaste(true, true, true)).toBe(false);
    expect(shouldSendTaste(false, false, true)).toBe(false);
    expect(shouldSendTaste(false, true, false)).toBe(false);
    expect(shouldSendTaste(false, true, true)).toBe(true);
    const s = emptySignals();
    recordTaste(s, "Spicy", true);
    recordTaste(s, "Spicy", false);
    expect(s.tastes["Spicy"]).toBe(0);
  });
});

describe("swipe classification", () => {
  it("taps, diagonals, slow drags and swipe-down do nothing", () => {
    expect(classifySwipe(10, -20, 100)).toBeNull();
    expect(classifySwipe(60, -60, 200)).toBeNull();
    expect(classifySwipe(0, -120, 1200)).toBeNull();
    expect(classifySwipe(0, 120, 200)).toBeNull();
  });
  it("up = next, left = details, right = vendor", () => {
    expect(classifySwipe(5, -120, 200)).toBe("next");
    expect(classifySwipe(-120, 10, 200)).toBe("details");
    expect(classifySwipe(120, 10, 200)).toBe("vendor");
  });
});
