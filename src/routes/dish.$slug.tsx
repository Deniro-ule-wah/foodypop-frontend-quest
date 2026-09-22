import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { getDish, createGesture, TASTES } from "@/lib/api/dishes";
import { createFollow, deleteFollow } from "@/lib/api/follows";
import { ApiError } from "@/lib/api/client";
import { ErrorBlock, GapNotice } from "@/components/state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { dishDisplayName, dishEffectivePrice, useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import { dishCategory, dishCuisine, dishImage } from "@/lib/taxonomy";
import { entitySlug } from "@/lib/slug";
import { idFromSlug } from "@/lib/slug";
import { breadcrumbList, canonicalUrl, jsonLd, seo, SITE_NAME } from "@/lib/seo";
import type { Dish } from "@/lib/api/types";

function truncate(value: string, max = 155): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/** Product JSON-LD built ONLY from fields the dish record actually carries. */
function dishJsonLd(dish: Dish, path: string) {
  const name = dishDisplayName(dish);
  const image = dishImage(dish);
  const price = dishEffectivePrice(dish);
  const currency = (dish.currency as string) || null;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url: canonicalUrl(path),
  };
  if (typeof dish.description === "string" && dish.description) data["description"] = dish.description;
  if (image) data["image"] = image;
  const category = dishCategory(dish)?.name;
  if (category) data["category"] = category;
  const brandName = dish.vendor?.name || dish.vendor?.displayName;
  if (brandName) data["brand"] = { "@type": "Brand", name: brandName };
  // Offers only when a real price AND currency exist. No invented availability.
  if (price !== null && currency) {
    data["offers"] = {
      "@type": "Offer",
      price: String(price),
      priceCurrency: currency,
      url: canonicalUrl(path),
    };
  }
  return data;
}

export const Route = createFileRoute("/dish/$slug")({
  loader: async ({ params }) => {
    try {
      const dish = await getDish(idFromSlug(params.slug));
      return { dish };
    } catch (error) {
      if (error instanceof ApiError && error.kind === "not_found") throw notFound();
      throw error;
    }
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Dish unavailable — FoodyPop" }, { name: "robots", content: "noindex" }],
      };
    }
    const dish = loaderData.dish;
    const name = dishDisplayName(dish);
    const path = `/dish/${params.slug}`;
    const title = `${name} | ${SITE_NAME}`;
    const description = truncate(
      typeof dish.description === "string" && dish.description
        ? dish.description
        : `Discover ${name} on FoodyPop — details, pricing and where to find it, as published by the vendor.`,
    );
    const image = dishImage(dish);
    const { meta, links } = seo({
      title,
      description,
      path,
      type: "product",
      ...(image && /^https:\/\//.test(image) ? { image } : {}),
    });
    const crumbs = [
      { name: "Home", path: "/" },
      { name: "Dishes", path: "/dishes" },
      { name, path },
    ];
    return {
      meta,
      links,
      scripts: [jsonLd(dishJsonLd(dish, path)), jsonLd(breadcrumbList(crumbs))],
    };
  },
  component: DishDetail,
});

function Field({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  const text = Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return (
    <div className="border-b border-border py-2 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{text}</dd>
    </div>
  );
}

function DishDetail() {
  const { slug } = Route.useParams();
  const { dish: d } = Route.useLoaderData();
  const { add } = useCart();
  const { token } = useSession();

  const follow = useMutation({
    mutationFn: (dish: Dish) => createFollow({ targetType: "DISH", targetId: dish.id }),
  });

  const unfollow = useMutation({
    mutationFn: (dish: Dish) =>
      deleteFollow({ targetType: "DISH", targetId: dish.id }),
  });

  const gesture = useMutation({
    mutationFn: (type: string) => createGesture(d.id, type),
  });

  // Determine the current user's active gesture from the dish's gestures array.
  const currentGesture: string | undefined = (() => {
    if (!token || !d.gestures) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = d.gestures as any[];
    if (!Array.isArray(arr)) return undefined;
    const match = arr.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (g: any) => (g.userId as string) === token || (g.user?.id as string) === token,
    );
    return match?.type as string | undefined;
  })();

  const name = dishDisplayName(d);
  const image = dishImage(d);
  const price = dishEffectivePrice(d);
  const cuisine = dishCuisine(d);
  const category = dishCategory(d);
  const vendorName = d.vendor?.name || d.vendor?.displayName || null;
  const vendorId = (d.vendor?.id as string) || (d.vendorId as string) || null;

  const followBtn = follow.isSuccess ? (
    <button
      type="button"
      className="btn-ghost"
      disabled={unfollow.isPending}
      onClick={() => unfollow.mutate(d)}
    >
      {unfollow.isPending ? "Unfollowing…" : "Unfollow"}
    </button>
  ) : (
    <button
      type="button"
      className="btn-secondary"
      disabled={!token || follow.isPending}
      onClick={() => follow.mutate(d)}
    >
      {follow.isPending ? "Following…" : "Follow dish"}
    </button>
  );

  return (
    <div className="grid gap-8">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Dishes", path: "/dishes" },
          { name, path: `/dish/${slug}` },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-border bg-muted">
          {image ? (
            <img
              src={image}
              alt={name}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
              No image published for this dish
            </div>
          )}
        </div>

        <div className="grid content-start gap-4">
          <h1 className="text-4xl text-foreground">{name}</h1>
          {d.description ? <p className="text-muted-foreground">{d.description}</p> : null}
          {price !== null ? (
            <p className="text-2xl font-semibold text-primary">
              {(d.currency as string) || "KES"} {price.toLocaleString()}
            </p>
          ) : null}
          {typeof d.tasteScore === "number" && d.tasteScore > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Taste score:</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-sm font-medium">
                {d.tasteScore.toFixed(0)}
                <span className="text-muted-foreground">/100</span>
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => add(d)}>
              Add to cart
            </button>
            {token ? followBtn : (
              <button
                type="button"
                className="btn-secondary"
                disabled
              >
                Follow dish
              </button>
            )}
          </div>
          {!token ? (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="underline">
                Sign in
              </Link>{" "}
              to follow dishes.
            </p>
          ) : null}
          {follow.isError ? <ErrorBlock error={follow.error} /> : null}
          {unfollow.isError ? <ErrorBlock error={unfollow.error} /> : null}
          {follow.isSuccess ? (
            <p className="text-sm text-[color:var(--color-success)]">Dish followed.</p>
          ) : null}

          <dl className="rounded-2xl border border-border bg-card p-4">
            <Field
              label="Classification"
              value={d.kind ?? d.type ?? (d.isDrink ? "Drink" : null)}
            />
            <Field
              label="Cooked / raw"
              value={
                d.isCooked === null || d.isCooked === undefined
                  ? d.preparation
                  : d.isCooked
                    ? "Cooked"
                    : "Raw"
              }
            />
            <Field label="Ingredients" value={d.ingredients} />
            <Field label="Recipe" value={d.recipe} />
            <Field label="Cuisine" value={cuisine?.name} />
            <Field label="Category" value={category?.name} />
            <Field
              label="Availability"
              value={
                d.availability ??
                (d.isAvailable === undefined ? null : d.isAvailable ? "Available" : "Unavailable")
              }
            />
            <Field label="Location" value={d.location} />
            <Field label="Vendor" value={vendorName ?? vendorId} />
          </dl>

          <nav aria-label="Related pages" className="text-sm text-muted-foreground">
            <ul className="flex flex-wrap gap-2">
              {cuisine?.name ? (
                <li>
                  <Link
                    to="/cuisine/$slug"
                    params={{ slug: entitySlug(cuisine.id ?? cuisine.name, cuisine.name) }}
                    className="underline"
                  >
                    More {cuisine.name} dishes
                  </Link>
                </li>
              ) : null}
              {category?.name ? (
                <li>
                  <Link
                    to="/category/$slug"
                    params={{ slug: entitySlug(category.id ?? category.name, category.name) }}
                    className="underline"
                  >
                    More in {category.name}
                  </Link>
                </li>
              ) : null}
              {vendorId ? (
                <li>
                  <Link to="/vendors/$vendorId" params={{ vendorId }} className="underline">
                    {vendorName ?? "Vendor"} page
                  </Link>
                </li>
              ) : null}
              <li>
                <Link to="/dishes" className="underline">
                  All dishes
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <section className="grid gap-3">
        <h2 className="text-2xl text-foreground">Taste reactions</h2>
        <p className="text-sm text-muted-foreground">
          Show what this dish tastes like to you. Your reaction helps others discover it.
        </p>
        <ul className="flex flex-wrap gap-2">
          {TASTES.map((t) => {
            const active = currentGesture === t;
            return (
              <li key={t}>
                <button
                  type="button"
                  className={`btn-secondary text-xs ${active ? "btn-primary" : ""}`}
                  disabled={!token || gesture.isPending}
                  onClick={() => gesture.mutate(t.toUpperCase())}
                >
                  {active ? `✓ ${t}` : t}
                </button>
              </li>
            );
          })}
        </ul>
        {!token ? (
          <p className="text-xs text-muted-foreground">
            <Link to="/auth" className="underline">
              Sign in
            </Link>{" "}
            to react to dishes.
          </p>
        ) : null}
        {gesture.isError ? <ErrorBlock error={gesture.error} /> : null}
        {gesture.isSuccess ? (
          <p className="text-sm text-[color:var(--color-success)]">
            Taste reaction recorded. Taste score updated.
          </p>
        ) : null}
      </section>
    </div>
  );
}
