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
      seen.add(d.id); s.seen.push(d.id); cur = d.id;
    }
  });
  it("thirsty with no drinks returns null", () => {
    expect(serveNextDish(all, { intent: "thirsty", type: "all", signals: emptySignals() })).toBeNull();
  });
  it("taste picks steer selection", () => {
    const s = emptySignals(); s.tastes["Sweet"] = 5;
    let sweet = 0;
    for (let i = 0; i < 200; i++) {
      const d = serveNextDish(all, { intent: "discover", type: "all", signals: s })!;
      if (demoTaste(d).includes("Sweet")) sweet++;
    }
    expect(sweet).toBeGreaterThan(100);
  });
  it("is not a fixed sequence", () => {
    const ids = new Set(Array.from({ length: 30 }, () => serveNextDish(all, { intent: "discover", type: "all", signals: emptySignals() })!.id));
    expect(ids.size).toBeGreaterThan(1);
  });
});
