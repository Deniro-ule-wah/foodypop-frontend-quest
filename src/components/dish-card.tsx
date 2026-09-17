import { Link } from "@tanstack/react-router";
import { dishDisplayName, dishEffectivePrice } from "@/lib/cart";
import type { Dish } from "@/lib/api/types";

function priceLabel(dish: Dish): string | null {
  const value = dishEffectivePrice(dish);
  if (value === null) return null;
  const currency = (dish.currency as string) || "KES";
  return `${currency} ${value.toLocaleString()}`;
}

export function DishCard({ dish }: { dish: Dish }) {
  const image = (dish.imageUrl as string) || (dish.mediaUrl as string) || dish.images?.[0] || null;
  const vendorName = dish.vendor?.name || dish.vendor?.displayName || null;
  const price = priceLabel(dish);
  const hasDiscount = dish.discountPrice != null && dish.price != null;

  return (
    <Link
      to="/dishes/$dishId"
      params={{ dishId: dish.id }}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[var(--shadow-warm)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={dishDisplayName(dish)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image provided
          </div>
        )}
      </div>
      <div className="grid gap-1 p-4">
        <h3 className="font-display text-lg leading-tight text-foreground">
          {dishDisplayName(dish)}
        </h3>
        {price ? (
          <p className="text-sm font-semibold text-primary">
            {price}
            {hasDiscount ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">discounted</span>
            ) : null}
          </p>
        ) : null}
        {vendorName ? <p className="text-xs text-muted-foreground">{vendorName}</p> : null}
      </div>
    </Link>
  );
}
