import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { createGesture, TASTES } from "@/lib/api/dishes";
import { createFollow, deleteFollow, listFollows } from "@/lib/api/follows";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dishDisplayName, dishEffectivePrice, useCart } from "@/lib/cart";
import { dishImage, dishCuisine, dishCategory } from "@/lib/taxonomy";
import { DishMedia, DishIdentity, buildMediaList } from "@/components/dish-media";
import { EmptyBlock } from "@/components/state";
import { useSession } from "@/lib/session";
import type { Dish } from "@/lib/api/types";

interface PopViewportProps {
  initialDish: Dish;
  initialIndex: number;
  feedItems: Dish[];
  onDishUpdate?: (dish: Dish) => void;
}

/**
 * DishPop viewport — the reusable dish-first experience.
 *
 * Visual hierarchy:
 *   1. Dish media (primary, prominent)
 *   2. Dish name + identity (kind, cuisine, category, vendor)
 *   3. Price
 *   4. Taste score
 *   5. Taste actions (gestures)
 *   6. Primary actions (add to cart, follow)
 *   7. Vendor context (secondary, inline)
 *
 * Vendor/social information stays subordinate to the dish.
 */
export function DishPopViewport({ initialDish, initialIndex, feedItems, onDishUpdate }: PopViewportProps) {
  const { add } = useCart();
  const { token, user } = useSession();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const dish = feedItems[currentIndex];
  const total = feedItems.length;

  // Server-authoritative follow state
  const followQuery = useQuery({
    queryKey: ["follows"],
    queryFn: ({ signal }) => listFollows(signal),
    enabled: !!token,
    select: (data: unknown) => {
      if (!data || typeof data !== "object") return new Set<string>();
      const body = data as Record<string, unknown>;
      const items = (body["items"] as Array<Record<string, unknown>>) ?? [];
      return new Set(items.filter((f) => f["targetType"] === "DISH").map((f) => f["targetId"] as string));
    },
  });

  const followedDishIds = followQuery.data ?? new Set<string>();
  const isFollowing = dish ? followedDishIds.has(dish.id) : false;

  const follow = useMutation({
    mutationFn: (body: { targetType: string; targetId: string }) => createFollow(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follows"] }),
  });

  const unfollow = useMutation({
    mutationFn: (body: { targetType: string; targetId: string }) => deleteFollow(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follows"] }),
  });

  // Taste gesture mutation — uses the real createGesture API
  const gesture = useMutation({
    mutationFn: (type: string) => {
      if (!dish) return Promise.reject(new Error("No dish"));
      return createGesture(dish.id, type);
    },
    onSuccess: () => {
      if (!dish) return;
      queryClient.invalidateQueries({ queryKey: ["dish", dish.id] });
      onDishUpdate?.(dish);
    },
  });

  const name = dish ? dishDisplayName(dish) : "";
  const image = dish ? dishImage(dish) : null;
  const price = dish ? dishEffectivePrice(dish) : null;
  const tasteScore = dish ? (dish["tasteScore"] as number | undefined) : undefined;
  const cuisine = dish ? dishCuisine(dish) : null;
  const category = dish ? dishCategory(dish) : null;
  const vendorName = dish ? (dish.vendor?.name || dish.vendor?.displayName || null) : null;
  const vendorId = dish ? (dish.vendor?.id || dish.vendorId || null) : null;

  // Current user's active gesture — derived from backend d.gestures filtered by user.id
  const currentGesture = dish && user?.id ? (() => {
    if (!dish["gestures"] || !Array.isArray(dish["gestures"])) return undefined;
    const match = dish["gestures"].find((g: unknown) => {
      const gAny = g as { userId?: string; type?: string };
      return gAny.userId === user.id && typeof gAny.type === "string";
    });
    return match ? (match as { type: string }).type : undefined;
  })() : undefined;

  const handleGesture = useCallback(
    (type: string) => {
      if (!token || !dish) return;
      gesture.mutate(type);
    },
    [token, dish, gesture],
  );

  const handleFollow = useCallback(() => {
    if (!token || !dish) return;
    if (isFollowing) {
      unfollow.mutate({ targetType: "DISH", targetId: dish.id });
    } else {
      follow.mutate({ targetType: "DISH", targetId: dish.id });
    }
  }, [token, dish, isFollowing, follow, unfollow]);

  if (!dish) return <EmptyBlock title="No dish selected" hint="Nothing to show here." />;

  // Reset media index when navigating to a different dish
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      setActiveMediaIndex(0);
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);
  useEffect(() => {
    if (!dish) return;
    if (activeMediaIndex >= buildMediaList(dish).length) {
      setActiveMediaIndex(0);
    }
  }, [dish?.id, activeMediaIndex]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
      {/* LEFT COLUMN: Media + basic info */}
      <div className="grid gap-4">
        <DishMedia dish={dish} activeIndex={activeMediaIndex} setActiveIndex={setActiveMediaIndex} />
        <div className="grid gap-2">
          <h1 className="text-3xl font-display leading-tight text-foreground">{name}</h1>
          <DishIdentity dish={dish} />
        </div>
        {/* Media navigation */}
        {feedItems.length > 1 ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-border px-3 py-1 text-sm hover:bg-secondary/40"
              onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : total - 1))}
              aria-label="Previous dish"
            >
              ← Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {total}
            </span>
            <button
              type="button"
              className="rounded-full border border-border px-3 py-1 text-sm hover:bg-secondary/40"
              onClick={() => setCurrentIndex((i) => (i < total - 1 ? i + 1 : 0))}
              aria-label="Next dish"
            >
              Next →
            </button>
          </div>
        ) : null}
      </div>

      {/* RIGHT COLUMN: Price, taste, actions, details */}
      <div className="grid gap-4 content-start">
        {/* Price */}
        {price !== null ? (
          <p className="text-2xl font-semibold text-primary">
            {(dish.currency as string) || "KES"} {price.toLocaleString()}
          </p>
        ) : null}

        {/* Taste score */}
        {typeof tasteScore === "number" && tasteScore > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Taste score:</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-sm font-medium">
              {tasteScore.toFixed(0)}
              <span className="text-muted-foreground">/100</span>
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Taste score — not enough data yet</p>
        )}

        {/* Taste gestures */}
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            Show what this dish tastes like to you.
          </p>
          <div className="flex flex-wrap gap-2">
            {TASTES.map((t) => {
              const active = currentGesture === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    active
                      ? "bg-[#F5A623] text-white font-medium"
                      : "border border-border bg-card hover:bg-secondary/40"
                  }`}
                  disabled={!token || gesture.isPending}
                  onClick={() => handleGesture(t)}
                >
                  {active ? `✓ ${t}` : t}
                </button>
              );
            })}
          </div>
          {!token ? (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="underline">Sign in</Link> to react to dishes.
            </p>
          ) : null}
          {gesture.isError ? (
            <p className="text-xs text-muted-foreground">Could not record gesture.</p>
          ) : null}
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-[#F5A623] px-4 py-2 text-sm font-medium text-white hover:bg-[#E0961F]"
            onClick={() => add(dish)}
          >
            Add to cart
          </button>
          {token ? (
            isFollowing ? (
              <button
                type="button"
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary/40"
                disabled={unfollow.isPending}
                onClick={handleFollow}
              >
                {unfollow.isPending ? "Unfollowing…" : "Unfollow"}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary/40"
                disabled={follow.isPending}
                onClick={handleFollow}
              >
                {follow.isPending ? "Following…" : "Follow dish"}
              </button>
            )
          ) : (
            <button
              type="button"
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
              disabled
            >
              Follow dish
            </button>
          )}
        </div>
        {!token ? (
          <p className="text-xs text-muted-foreground">
            <Link to="/auth" className="underline">Sign in</Link> to follow dishes.
          </p>
        ) : null}

        {/* Vendor context (secondary) */}
        {vendorName ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendor</p>
            <p className="mt-1 text-foreground">
              {vendorName}
              {vendorId ? (
                <Link to="/vendors/$vendorId" params={{ vendorId }} className="ml-1 underline hover:text-[#F5A623]">
                  View page
                </Link>
              ) : null}
            </p>
          </div>
        ) : null}

        {/* Dish details (secondary) */}
        {dish.description ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{dish.description}</p>
          </div>
        ) : null}

        {/* Taxonomy links */}
        {cuisine?.name || category?.name ? (
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {cuisine?.name ? (
              <Link
                to="/cuisine/$slug"
                params={{ slug: `${cuisine.id || "cuisine"}--${dish.id}` }}
                className="underline hover:text-foreground"
              >
                More {cuisine.name}
              </Link>
            ) : null}
            {category?.name ? (
              <Link
                to="/category/$slug"
                params={{ slug: `${category.id || "category"}--${dish.id}` }}
                className="underline hover:text-foreground"
              >
                More in {category.name}
              </Link>
            ) : null}
            <Link to="/dishes" className="underline hover:text-foreground">All dishes</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
