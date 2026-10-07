import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { entitySlug } from "@/lib/slug";
import { dishCuisine, dishCategory } from "@/lib/taxonomy";
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

/** DishPop media — large primary image, gallery controls only when there are
 * 2+ images, swipe on touch, and honest loading / missing / failed states.
 * Never substitutes placeholder food photography. */
export function DishMedia({
  dish,
  activeIndex = 0,
  setActiveIndex,
}: {
  dish: Dish;
  activeIndex?: number;
  setActiveIndex?: (index: number) => void;
}) {
  const mediaList = buildMediaList(dish);
  const total = mediaList.length;
  const safeIdx = Math.min(activeIndex, Math.max(total - 1, 0));
  const currentSrc = mediaList[safeIdx] ?? null;
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");
  const touchX = useRef<number | null>(null);
  const name = dish.name || dish.title || "Dish";

  useEffect(() => setStatus("loading"), [currentSrc]);

  const go = (delta: number) => {
    if (total < 2 || !setActiveIndex) return;
    setActiveIndex((safeIdx + delta + total) % total);
  };

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-muted"
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start == null || end == null || Math.abs(end - start) < 40) return;
        go(end < start ? 1 : -1);
      }}
    >
      {currentSrc && status !== "failed" ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={total > 1 ? `${name} — photo ${safeIdx + 1} of ${total}` : name}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("failed")}
          className={`h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
      {currentSrc && status === "loading" ? (
        <div
          className="absolute inset-0 animate-pulse bg-muted motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : null}
      {!currentSrc || status === "failed" ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          {currentSrc ? "This photo couldn't be loaded" : "No image published for this dish"}
        </div>
      ) : null}

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground shadow hover:bg-background"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground shadow hover:bg-background"
          >
            →
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/70 px-2 py-1">
            {mediaList.map((url, i) => (
              <button
                key={url}
                type="button"
                className={`h-2.5 w-2.5 rounded-full ${i === safeIdx ? "bg-primary" : "bg-muted-foreground/40"}`}
                aria-label={`Show image ${i + 1} of ${total}`}
                aria-current={i === safeIdx ? "true" : undefined}
                onClick={() => setActiveIndex?.(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Dish identity — kind, cuisine, category (vendor is shown later in the POP). */
export function DishIdentity({ dish }: { dish: Dish }) {
  const kind = dish.kind || dish.type || (dish.isDrink ? "DRINK" : null);
  const cuisine = dishCuisine(dish);
  const category = dishCategory(dish);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {kind ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-foreground">
          {String(kind)}
        </span>
      ) : null}
      {cuisine?.name ? (
        <Link
          to="/cuisine/$slug"
          params={{ slug: entitySlug(cuisine.id || "cuisine", cuisine.name) }}
          className="underline hover:text-foreground"
        >
          {cuisine.name}
        </Link>
      ) : null}
      {category?.name ? (
        <Link
          to="/category/$slug"
          params={{ slug: entitySlug(category.id || "category", category.name) }}
          className="underline hover:text-foreground"
        >
          {category.name}
        </Link>
      ) : null}
    </div>
  );
}
