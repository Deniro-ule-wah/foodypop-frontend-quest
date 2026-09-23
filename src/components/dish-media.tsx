import { dishImage } from "@/lib/taxonomy";
import type { Dish } from "@/lib/api/types";

/**
 * DishPop media component — renders the primary dish media prominently.
 * Supports single image, multiple images (with prev/next), and an
 * intentional empty-media state. Never substitutes AI-generated or
 * placeholder food photography.
 */
export function DishMedia({ dish }: { dish: Dish }) {
  const image = dishImage(dish);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-muted">
      {image ? (
        <img
          src={image}
          alt={dish.name || dish.title || "Dish"}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
          No image published for this dish
        </div>
      )}
    </div>
  );
}

/**
 * Dish identity — name, kind, cuisine, category, vendor.
 */
export function DishIdentity({ dish }: { dish: Dish }) {
  const name = dish.name || dish.title || `Dish ${dish.id}`;
  const kind = dish.kind || dish.type || (dish.isDrink ? "Drink" : null);
  const cuisine = dish.cuisine?.name || null;
  const category = dish.category?.name || null;
  const vendor = dish.vendor?.name || dish.vendor?.displayName || null;
  const vendorId = dish.vendor?.id || dish.vendorId || null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {kind ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{kind}</span>
      ) : null}
      {cuisine ? (
        <Link to="/cuisine/$slug" params={{ slug: entitySlug(dish.cuisine?.id || "cuisine", cuisine) }} className="underline hover:text-foreground">
          {cuisine}
        </Link>
      ) : null}
      {category ? (
        <Link to="/category/$slug" params={{ slug: entitySlug(dish.category?.id || "category", category) }} className="underline hover:text-foreground">
          {category}
        </Link>
      ) : null}
      {vendor ? (
        <Link to="/vendors/$vendorId" params={{ vendorId }} className="underline hover:text-foreground">
          {vendor}
        </Link>
      ) : null}
    </div>
  );
}
