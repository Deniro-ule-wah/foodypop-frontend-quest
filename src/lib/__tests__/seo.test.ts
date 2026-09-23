import { describe, expect, it } from "vitest";
import { breadcrumbList, canonicalUrl, seo, SITE_URL } from "../seo";
import { entitySlug, idFromSlug, slugify } from "../slug";
import { dishIsDrink, refMatches, taxonomyName } from "../taxonomy";

describe("canonical URLs", () => {
  it("self-references the page path", () => {
    expect(canonicalUrl("/food")).toBe(`${SITE_URL}/food`);
  });

  it("normalises trailing slashes", () => {
    expect(canonicalUrl("/food/")).toBe(`${SITE_URL}/food`);
  });

  it("never points a subpage at the homepage", () => {
    expect(canonicalUrl("/cuisine/kenyan--1")).not.toBe(SITE_URL);
  });
});

describe("seo()", () => {
  const out = seo({
    title: "Nyama Choma | FoodyPop",
    description: "Grilled meat listing.",
    path: "/dish/nyama-choma--42",
    type: "product",
  });

  it("emits title, description, canonical and og:url for the same page", () => {
    expect(out.meta.find((m) => m["title"])?.["title"]).toBe("Nyama Choma | FoodyPop");
    expect(out.meta.find((m) => m["name"] === "description")?.["content"]).toBe(
      "Grilled meat listing.",
    );
    const canonical = out.links.find((l) => l["rel"] === "canonical")?.["href"];
    const ogUrl = out.meta.find((m) => m["property"] === "og:url")?.["content"];
    expect(canonical).toBe(`${SITE_URL}/dish/nyama-choma--42`);
    expect(ogUrl).toBe(canonical);
  });

  it("omits og:image when there is no real https image", () => {
    expect(out.meta.some((m) => m["property"] === "og:image")).toBe(false);
  });

  it("marks private pages noindex and gives them no canonical", () => {
    const priv = seo({ title: "Cart", description: "Basket", path: "/cart", noindex: true });
    expect(priv.meta.find((m) => m["name"] === "robots")?.["content"]).toContain("noindex");
    expect(priv.links).toHaveLength(0);
  });
});

describe("breadcrumbs", () => {
  it("builds ordered absolute BreadcrumbList items", () => {
    const list = breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Dishes", path: "/dishes" },
    ]) as { itemListElement: Array<{ position: number; item: string }> };
    expect(list.itemListElement[0]?.position).toBe(1);
    expect(list.itemListElement[1]?.item).toBe(`${SITE_URL}/dishes`);
  });
});

describe("slugs", () => {
  it("keeps the backend id authoritative", () => {
    const slug = entitySlug("cmuc6kfa40006", "Payment Test Dish");
    expect(slug).toBe("payment-test-dish--cmuc6kfa40006");
    expect(idFromSlug(slug)).toBe("cmuc6kfa40006");
  });

  it("falls back to the bare id when there is no name", () => {
    expect(entitySlug("abc123")).toBe("abc123");
    expect(idFromSlug("abc123")).toBe("abc123");
  });

  it("slugifies safely", () => {
    expect(slugify("Nyama Choma & Ugali!")).toBe("nyama-choma-ugali");
  });
});

describe("classification never guesses", () => {
  it("returns null when the record gives no signal", () => {
    expect(dishIsDrink({ id: "1", name: "Mystery" })).toBeNull();
  });

  it("uses the record's own flag", () => {
    expect(dishIsDrink({ id: "1", isDrink: true })).toBe(true);
    expect(dishIsDrink({ id: "1", isDrink: false })).toBe(false);
  });
});

describe("taxonomy matching", () => {
  it("matches by id or name only", () => {
    expect(refMatches({ id: "c1", name: null }, { id: "c1", name: "Kenyan" })).toBe(true);
    expect(refMatches({ id: null, name: "kenyan" }, { id: "c1", name: "Kenyan" })).toBe(true);
    expect(refMatches({ id: null, name: "Indian" }, { id: "c1", name: "Kenyan" })).toBe(false);
    expect(refMatches(null, { id: "c1", name: "Kenyan" })).toBe(false);
  });

  it("names taxonomies without inventing labels", () => {
    expect(taxonomyName({ id: "x" })).toBe("x");
  });
});

describe("robots.txt policy expectations", () => {
  it("private areas are the ones marked noindex in the app", () => {
    for (const path of ["/cart", "/auth", "/orders", "/diagnostics", "/search"]) {
      const out = seo({ title: "t", description: "d", path, noindex: true });
      expect(out.meta.some((m) => m["name"] === "robots")).toBe(true);
    }
  });
});
