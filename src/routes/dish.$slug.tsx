import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDish, getDishFeed, createGesture, TASTES } from "@/lib/api/dishes";
import { createFollow, deleteFollow, listFollows } from "@/lib/api/follows";
import { ApiError } from "@/lib/api/client";
import { DishPopViewport } from "@/components/dish-pop";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { dishDisplayName, dishEffectivePrice } from "@/lib/cart";
import { dishCategory, dishCuisine, dishImage } from "@/lib/taxonomy";
import { entitySlug, idFromSlug } from "@/lib/slug";
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
  if (typeof dish.description === "string" && dish.description)
    data["description"] = dish.description;
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
      let feed: { items: Dish[]; nextCursor: string | null; hasMore: boolean } | null = null;
      try {
        feed = await getDishFeed({ limit: 24 });
      } catch {
        // Feed optional — navigation degrades gracefully
      }
      return { dish, feed };
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

  return (
    <div className="grid gap-8">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Dishes", path: "/dishes" },
          { name: dishDisplayName(d), path: `/dish/${slug}` },
        ]}
      />
      <DishPopViewport
        initialDish={d}
        initialIndex={0}
        feedItems={Route.useLoaderData().feed?.items ?? []}
        onDishUpdate={() => {}}
      />
    </div>
  );
}
