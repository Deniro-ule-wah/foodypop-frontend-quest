import { useState, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { createGesture, TASTES } from "@/lib/api/dishes";
import { createFollow, deleteFollow, listFollows } from "@/lib/api/follows";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dishDisplayName, dishEffectivePrice, useCart } from "@/lib/cart";
import { DishMedia, DishIdentity } from "@/components/dish-media";
import { EmptyBlock } from "@/components/state";
import { useSession } from "@/lib/session";
import type { Dish } from "@/lib/api/types";
import { demoReviews, demoTags, demoTaste, demoVendor, isDemoDish } from "@/lib/demo/catalog";

interface PopViewportProps {
  initialDish: Dish;
  initialIndex?: number;
  feedItems?: Dish[];
  onDishUpdate?: (dish: Dish) => void;
  /** Renders the dish name heading. Defaults to an <h1> (page variant). */
  renderTitle?: (name: string) => ReactNode;
  /** Show previous/next dish navigation (page variant only). */
  showDishNav?: boolean;
}

const chip = "rounded-full px-3 py-1 text-sm";
const section = "grid gap-2 rounded-2xl border border-border bg-card p-4";
const label = "text-xs uppercase tracking-wide text-muted-foreground";

/**
 * DishPop viewport — dish-first hierarchy:
 * media → identity → price → taste → details → reviews → vendor → actions.
 */
export function DishPopViewport({
  initialDish,
  initialIndex = 0,
  feedItems = [],
  onDishUpdate,
  renderTitle,
  showDishNav = true,
}: PopViewportProps) {
  const { add } = useCart();
  const { token, user } = useSession();
  const queryClient = useQueryClient();

  const navItems = feedItems.some((d) => d.id === initialDish.id)
    ? feedItems
    : [initialDish, ...feedItems];
  const [currentIndex, setCurrentIndex] = useState(() => {
    const i = navItems.findIndex((d) => d.id === initialDish.id);
    return i >= 0 ? i : initialIndex;
  });
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const dish: Dish | undefined = navItems[currentIndex];
  const total = navItems.length;
  const demo = isDemoDish(dish);

  useEffect(() => setActiveMediaIndex(0), [dish?.id]);

  // Server-authoritative follow state (never queried for demo dishes)
  const followQuery = useQuery({
    queryKey: ["follows"],
    queryFn: ({ signal }) => listFollows(signal),
    enabled: !!token && !demo,
    select: (data: unknown) => {
      if (!data || typeof data !== "object") return new Set<string>();
      const items =
        ((data as Record<string, unknown>)["items"] as Array<Record<string, unknown>>) ?? [];
      return new Set(
        items.filter((f) => f["targetType"] === "DISH").map((f) => f["targetId"] as string),
      );
    },
  });
  const isFollowing = dish ? (followQuery.data?.has(dish.id) ?? false) : false;

  const follow = useMutation({
    mutationFn: (body: { targetType: string; targetId: string }) => createFollow(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follows"] }),
  });
  const unfollow = useMutation({
    mutationFn: (body: { targetType: string; targetId: string }) => deleteFollow(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follows"] }),
  });
  const gesture = useMutation({
    mutationFn: (type: string) => {
      // Guard: demo records never reach production mutation endpoints.
      if (!dish || isDemoDish(dish)) return Promise.reject(new Error("Unavailable"));
      return createGesture(dish.id, type);
    },
    onSuccess: () => {
      if (!dish) return;
      queryClient.invalidateQueries({ queryKey: ["dish", dish.id] });
      onDishUpdate?.(dish);
    },
  });

  if (!dish) return <EmptyBlock title="No dish selected" hint="Nothing to show here." />;

  const name = dishDisplayName(dish);
  const price = dishEffectivePrice(dish);
  const currency = (dish.currency as string) || "KES";
  const original = typeof dish.price === "number" ? dish.price : null;
  const hasDiscount = original !== null && price !== null && price < original;
  const tasteScore = dish["tasteScore"] as number | undefined;
  const vendorName = dish.vendor?.name || dish.vendor?.displayName || null;
  const vendorId = dish.vendor?.id || dish.vendorId || null;
  const vendorInfo = vendorId ? demoVendor(vendorId) : null;
  const ingredients = Array.isArray(dish["ingredients"]) ? (dish["ingredients"] as string[]) : [];
  const reviews = demo ? demoReviews(dish) : [];
  const currentGesture =
    user?.id && Array.isArray(dish["gestures"])
      ? (dish["gestures"] as Array<{ userId?: string; type?: string }>).find(
          (g) => g.userId === user.id,
        )?.type
      : undefined;

  return (
    <article className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
      <div className="grid content-start gap-4">
        <DishMedia
          dish={dish}
          activeIndex={activeMediaIndex}
          setActiveIndex={setActiveMediaIndex}
        />
        {showDishNav && total > 1 ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary/40"
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
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary/40"
              onClick={() => setCurrentIndex((i) => (i < total - 1 ? i + 1 : 0))}
              aria-label="Next dish"
            >
              Next →
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid min-w-0 content-start gap-4">
        {/* Identity + price */}
        <div className="grid gap-2">
          {demo ? (
            <span className={`${label} w-fit rounded-full border border-border px-2 py-0.5`}>
              Demo catalog
            </span>
          ) : null}
          {renderTitle ? (
            renderTitle(name)
          ) : (
            <h1 className="font-display text-3xl leading-tight text-foreground">{name}</h1>
          )}
          <DishIdentity dish={dish} />
          {price !== null ? (
            <p className="text-2xl font-semibold text-primary">
              {currency} {price.toLocaleString()}
              {hasDiscount ? (
                <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                  {currency} {original!.toLocaleString()}
                </span>
              ) : null}
              {demo ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  illustrative price
                </span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Price not published yet</p>
          )}
        </div>

        {/* Taste */}
        {demo ? (
          <div className={section}>
            <p className={label}>Taste profile · proposed by the demo catalog, not user stats</p>
            <div className="flex flex-wrap gap-2">
              {demoTaste(dish).map((t) => (
                <span key={t} className={`${chip} bg-primary/10 text-primary`}>
                  {t}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Taste reactions are off for demo dishes.
            </p>
          </div>
        ) : (
          <div className={section}>
            <p className={label}>Taste</p>
            <p className="text-sm text-muted-foreground">
              {typeof tasteScore === "number" && tasteScore > 0
                ? `Taste score ${tasteScore.toFixed(0)}/100 from FoodyPop reactions`
                : "Taste score — not enough reactions yet"}
            </p>
            <p className="text-sm text-foreground">What does this taste like to you?</p>
            <div className="flex flex-wrap gap-2">
              {TASTES.map((t) => {
                const active = currentGesture === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    className={`${chip} transition-colors ${active ? "bg-primary font-medium text-primary-foreground" : "border border-border bg-card hover:bg-secondary/40"}`}
                    disabled={!token || gesture.isPending}
                    onClick={() => gesture.mutate(t)}
                  >
                    {active ? `✓ ${t}` : t}
                  </button>
                );
              })}
            </div>
            {!token ? (
              <p className="text-xs text-muted-foreground">
                <Link to="/auth" className="underline">
                  Sign in
                </Link>{" "}
                to react to dishes.
              </p>
            ) : null}
            {gesture.isError ? (
              <p className="text-xs text-destructive">Could not record your reaction. Try again.</p>
            ) : null}
          </div>
        )}

        {/* Details */}
        {dish.description || ingredients.length || demoTags(dish).length ? (
          <div className={section}>
            <p className={label}>About this dish</p>
            {dish.description ? (
              <p className="text-sm text-foreground">{String(dish.description)}</p>
            ) : null}
            {ingredients.length ? (
              <p className="text-sm text-muted-foreground">Ingredients: {ingredients.join(", ")}</p>
            ) : null}
            {demoTags(dish).length ? (
              <div className="flex flex-wrap gap-2">
                {demoTags(dish).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Reviews */}
        <div className={`${section} ${demo ? "border-dashed" : ""}`}>
          <p className={label}>{demo ? "Sample reviews · Demo content" : "Reviews"}</p>
          {reviews.length ? (
            reviews.map((r) => (
              <blockquote key={r.text} className="text-sm text-foreground">
                “{r.text}” <span className="text-muted-foreground">— {r.stars}★ sample</span>
              </blockquote>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </div>

        {/* Vendor (secondary) */}
        {vendorName ? (
          <div className={section}>
            <p className={label}>Made by{vendorInfo ? " · demo vendor" : ""}</p>
            <p className="font-medium text-foreground">{vendorName}</p>
            {vendorInfo ? (
              <>
                <p className="text-sm italic text-muted-foreground">{vendorInfo.tagline}</p>
                <p className="text-sm text-muted-foreground">
                  {vendorInfo.location as string} · {vendorInfo.fulfillment.join(" · ")} (sample
                  details, not verified)
                </p>
              </>
            ) : null}
            {vendorId ? (
              <Link
                to="/vendors/$vendorId"
                params={{ vendorId }}
                className="w-fit text-sm underline hover:text-primary"
              >
                View vendor
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* Actions */}
        {demo ? (
          <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
            Browse only — ordering and following open once a real vendor publishes this dish.
          </p>
        ) : (
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              {price !== null ? (
                <button
                  type="button"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  onClick={() => add(dish)}
                >
                  Add to cart
                </button>
              ) : null}
              {token ? (
                <button
                  type="button"
                  className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary/40"
                  disabled={follow.isPending || unfollow.isPending}
                  onClick={() =>
                    (isFollowing ? unfollow : follow).mutate({
                      targetType: "DISH",
                      targetId: dish.id,
                    })
                  }
                >
                  {follow.isPending
                    ? "Following…"
                    : unfollow.isPending
                      ? "Unfollowing…"
                      : isFollowing
                        ? "Unfollow dish"
                        : "Follow dish"}
                </button>
              ) : null}
            </div>
            {!token ? (
              <p className="text-xs text-muted-foreground">
                <Link to="/auth" className="underline">
                  Sign in
                </Link>{" "}
                to follow dishes.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
