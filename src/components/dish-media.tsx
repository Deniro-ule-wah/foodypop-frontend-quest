import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { entitySlug } from "@/lib/slug";
import { dishCuisine, dishCategory, dishImage } from "@/lib/taxonomy";
import type { Dish } from "@/lib/api/types";

/** Build an ordered, deduplicated media list from a dish record.
 * Order: imageUrl → mediaUrl → images[] (first occurrence wins). */
export function buildMediaList(dish: Dish): string[] {
  const list: string[] = [];
  const seen = new Set<string>();

  const push = (url: string | undefined | null) => {
    if (typeof url === "string" && url.trim() && !seen.has(url)) {
      seen.add(url);
      list.push(url);
    }
  };

  push(dish.imageUrl);
  push(dish.mediaUrl);
  dish.images?.forEach(push);
  return list;
}

/** DishPop media component — renders the primary dish media prominently.
 * Supports single image, multiple images (with prev/next + dots), and an
 * intentional empty-media state. Never substitutes AI-generated or
 * placeholder food photography.
 */
export function DishMedia({ dish, activeIndex, setActiveIndex }: {
  dish: Dish;
  activeIndex?: number;
  setActiveIndex?: (index: number) => void;
}) {
  const mediaList = buildMediaList(dish);
  const total = mediaList.length;

  // Keep active index in range when the media list changes (e.g. dish navigation)
  const localIdx = typeof activeIndex === "number" ? activeIndex : 0;
  const safeIdx = Math.min(localIdx, Math.max(total - 1, 0));
  const currentSrc = mediaList[safeIdx] ?? null;
  const controlled = typeof activeIndex === "number" && setActiveIndex != null;

  const goPrev = () => {
    if (total < 2) return;
    const next = safeIdx === 0 ? total - 1 : safeIdx - 1;
    controlled ? setActiveIndex(next) : null;
  };

  const goNext = () => {
    if (total < 2) return;
    const next = safeIdx === total - 1 ? 0 : safeIdx + 1;
    controlled ? setActiveIndex(next) : null;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-muted">
      {currentSrc ? (
        <>
          <img
            src={currentSrc}
            alt={dish.name || dish.title || "Dish"}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
          {total > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-3">
              <button
                type="button"
                className="rounded-full border border-border bg-secondary/60 px-2 py-1 text-xs text-foreground hover:bg-secondary"
                onClick={goPrev}
                aria-label="Previous image"
              >
                ←
              </button>
              <div className="flex gap-1.5">
                {mediaList.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    className={`h-2 w-2 rounded-full border transition-colors ${
                      i === safeIdx
                        ? "border-[#F5A623] bg-[#F5A623] text-white"
                        : "border-border bg-transparent hover:border-foreground/40"
                    }`}
                    aria-label={`Image ${i + 1} of ${total}`}
                    aria-current={i === safeIdx ? "true" : undefined}
                    onClick={() => controlled ? setActiveIndex(i) : null}
                  />
                ))}
              </div>
              <button
                type="button"
                className="rounded-full border border-border bg-secondary/60 px-2 py-1 text-xs text-foreground hover:bg-secondary"
                onClick={goNext}
                aria-label="Next image"
              >
                →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
          No image published for this dish
        </div>
      )}
    </div>
  );
}

/** Dish identity — name, kind, cuisine, category, vendor. */
export function DishIdentity({ dish }: { dish: Dish }) {
  const name = dish.name || dish.title || `Dish ${dish.id}`;
  const kind = dish.kind || dish.type || (dish.isDrink ? "Drink" : null);
  const cuisine = dishCuisine(dish);
  const category = dishCategory(dish);
  const vendor = dish.vendor?.name || dish.vendor?.displayName || null;
  const vendorId = dish.vendor?.id || dish.vendorId || null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {kind ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{kind}</span>
      ) : null}
      {cuisine?.name ? (
        <Link to="/cuisine/$slug" params={{ slug: entitySlug(cuisine.id || "cuisine", cuisine.name) }} className="underline hover:text-foreground">
          {cuisine.name}
        </Link>
      ) : null}
      {category?.name ? (
        <Link to="/category/$slug" params={{ slug: entitySlug(category.id || "category", category.name) }} className="underline hover:text-foreground">
          {category.name}
        </Link>
      ) : null}
      {vendor && vendorId ? (
        <Link to="/vendors/$vendorId" params={{ vendorId }} className="underline hover:text-foreground">
          {vendor}
        </Link>
      ) : null}
    </div>
  );
}
