import { Link } from "@tanstack/react-router";
import { dishDisplayName, dishEffectivePrice } from "@/lib/cart";
import { dishImage } from "@/lib/taxonomy";
import { entitySlug } from "@/lib/slug";
import type { Dish } from "@/lib/api/types";
import { demoTaste, isDemoDish } from "@/lib/demo/catalog";

function priceLabel(dish: Dish): string | null {
  const value = dishEffectivePrice(dish);
  if (value === null) return null;
  const currency = (dish.currency as string) || "KES";
  return `${currency} ${value.toLocaleString()}`;
}

export function DishCard({ dish, priority = false }: { dish: Dish; priority?: boolean }) {
  const image = dishImage(dish);
  const name = dishDisplayName(dish);
  const vendorName = dish.vendor?.name || dish.vendor?.displayName || null;
  const price = priceLabel(dish);
  const hasDiscount = dish.discountPrice != null && dish.price != null;

  return (
    <Link
      to="/dish/$slug"
      params={{ slug: entitySlug(dish.id, name) }}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[var(--shadow-warm)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {isDemoDish(dish) ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Demo
          </span>
        ) : null}
        {image ? (
          <img
            src={image}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image provided
          </div>
        )}
      </div>
      <div className="grid gap-1 p-4">
        <h3 className="font-display text-lg leading-tight text-foreground">{name}</h3>
        {price ? (
          <p className="text-sm font-semibold text-primary">
            {price}
            {hasDiscount ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">discounted</span>
            ) : null}
          </p>
        ) : null}
        {demoTaste(dish).length ? (
          <p className="text-xs text-foreground/80">{demoTaste(dish).join(" · ")}</p>
        ) : null}
        {vendorName ? <p className="text-xs text-muted-foreground">{vendorName}</p> : null}
      </div>
    </Link>
  );
}
