import { describe, expect, it } from "vitest";
import { buildMediaList } from "@/components/dish-media";
import { dishEffectivePrice, dishDisplayName } from "@/lib/cart";
import type { Dish } from "@/lib/api/types";

/** Factory without a default name so fallback tests are meaningful. */
function mkDish(overrides: Partial<Dish> = {}): Dish {
  const base = { id: "d1" };
  return { ...base, ...overrides } as Dish;
}

describe("buildMediaList — Phase 3B media hardening", () => {
  it("returns empty list when no media fields present", () => {
    expect(buildMediaList(mkDish())).toEqual([]);
  });

  it("returns imageUrl when only that is present", () => {
    expect(buildMediaList(mkDish({ imageUrl: "https://x.com/a.jpg" }))).toEqual([
      "https://x.com/a.jpg",
    ]);
  });

  it("falls back to mediaUrl when imageUrl absent", () => {
    expect(buildMediaList(mkDish({ mediaUrl: "https://x.com/b.jpg" }))).toEqual([
      "https://x.com/b.jpg",
    ]);
  });

  it("includes both imageUrl and mediaUrl when distinct", () => {
    // imageUrl is primary, mediaUrl is secondary — both are included
    expect(
      buildMediaList(mkDish({ imageUrl: "https://x.com/a.jpg", mediaUrl: "https://x.com/b.jpg" })),
    ).toEqual(["https://x.com/a.jpg", "https://x.com/b.jpg"]);
  });

  it("deduplicates when imageUrl and mediaUrl are identical", () => {
    expect(
      buildMediaList(mkDish({ imageUrl: "https://x.com/same.jpg", mediaUrl: "https://x.com/same.jpg" })),
    ).toEqual(["https://x.com/same.jpg"]);
  });

  it("appends images[] after primary fields", () => {
    expect(
      buildMediaList(
        mkDish({
          imageUrl: "https://x.com/a.jpg",
          images: ["https://x.com/b.jpg", "https://x.com/c.jpg"],
        }),
      ),
    ).toEqual(["https://x.com/a.jpg", "https://x.com/b.jpg", "https://x.com/c.jpg"]);
  });

  it("deduplicates identical URLs across fields", () => {
    expect(
      buildMediaList(
        mkDish({
          imageUrl: "https://x.com/a.jpg",
          images: ["https://x.com/a.jpg", "https://x.com/b.jpg"],
        }),
      ),
    ).toEqual(["https://x.com/a.jpg", "https://x.com/b.jpg"]);
  });

  it("skips blank/whitespace-only URLs", () => {
    expect(
      buildMediaList(mkDish({ imageUrl: "  ", mediaUrl: "https://x.com/good.jpg" })),
    ).toEqual(["https://x.com/good.jpg"]);
  });

  it("respects imageUrl → mediaUrl → images[] ordering", () => {
    expect(
      buildMediaList(
        mkDish({
          mediaUrl: "https://x.com/secondary.jpg",
          images: ["https://x.com/c.jpg"],
        }),
      ),
    ).toEqual(["https://x.com/secondary.jpg", "https://x.com/c.jpg"]);
  });
});

describe("dishEffectivePrice — Phase 3B pricing", () => {
  it("returns price when no discount", () => {
    expect(dishEffectivePrice(mkDish({ price: 500 }))).toBe(500);
  });

  it("returns discountPrice when present", () => {
    expect(dishEffectivePrice(mkDish({ price: 500, discountPrice: 350 }))).toBe(350);
  });

  it("returns null when no price data", () => {
    expect(dishEffectivePrice(mkDish())).toBeNull();
  });

  it("handles string-encoded numeric price", () => {
    expect(dishEffectivePrice(mkDish({ price: "800" }))).toBe(800);
  });
});

describe("dishDisplayName — Phase 3B identity", () => {
  it("uses name when present", () => {
    expect(dishDisplayName(mkDish({ name: "Nyama Choma" }))).toBe("Nyama Choma");
  });

  it("falls back to title", () => {
    expect(dishDisplayName(mkDish({ title: "Escamvi Special" }))).toBe("Escamvi Special");
  });

  it("falls back to Dish {id} when no name/title", () => {
    expect(dishDisplayName(mkDish({ id: "abc-123" }))).toBe("Dish abc-123");
  });
});
