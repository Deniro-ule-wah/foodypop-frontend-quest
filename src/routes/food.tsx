import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDishFeed, TASTES } from "@/lib/api/dishes";
import { demoTaste } from "@/lib/demo/catalog";
import { DishGrid } from "@/components/dish-grid";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { dishIsDrink } from "@/lib/taxonomy";
import { breadcrumbList, collectionPage, jsonLd, seo } from "@/lib/seo";

const TITLE = "Food on FoodyPop — dishes worth trying";
const DESCRIPTION =
  "Browse cooked food and dishes listed on FoodyPop, with cuisine, category, price and vendor details straight from the FoodyPop kitchen network.";
const PATH = "/food";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Food", path: PATH },
];

export const Route = createFileRoute("/food")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return {
      meta,
      links,
      scripts: [
        jsonLd(collectionPage({ name: "Food", description: DESCRIPTION, path: PATH })),
        jsonLd(breadcrumbList(CRUMBS)),
      ],
    };
  },
  component: FoodHub,
});

function FoodHub() {
  const feed = useQuery({
    queryKey: ["dishes", "feed", "hub"],
    queryFn: ({ signal }) => getDishFeed({ limit: 48 }, signal),
    retry: false,
  });

  const [taste, setTaste] = useState<string | null>(null);
  const dishes = feed.data?.items.filter(
    (d) => dishIsDrink(d) !== true && (!taste || demoTaste(d).includes(taste)),
  );

  return (
    <div className="grid gap-8">
      <Breadcrumbs crumbs={CRUMBS} />
      <header className="grid gap-3">
        <h1 className="text-4xl text-foreground">Food</h1>
        <p className="max-w-2xl text-muted-foreground">
          Every plate below is published by a FoodyPop vendor. Drinks live on their own hub, so this
          page stays about cooked food and dishes.
        </p>
        <p className="text-sm text-muted-foreground">
          Looking for something else?{" "}
          <Link to="/drinks" className="underline">
            Drinks
          </Link>
          {" · "}
          <Link to="/cuisines" className="underline">
            Cuisines
          </Link>
          {" · "}
          <Link to="/categories" className="underline">
            Categories
          </Link>
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-2xl text-foreground">Dishes</h2>
        <div role="group" aria-label="Filter by taste" className="flex flex-wrap gap-2">
          {[null, ...TASTES].map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              aria-pressed={taste === t}
              onClick={() => setTaste(t)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${taste === t ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary/40"}`}
            >
              {t ?? "All tastes"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Taste filters use demo catalog taste metadata, not measured customer data.</p>
        <DishGrid
          dishes={dishes}
          isPending={feed.isPending}
          error={feed.isError ? feed.error : null}
          onRetry={() => feed.refetch()}
          emptyTitle="No food dishes published yet"
          emptyHint="The FoodyPop dish feed returned no food items. Nothing is substituted in their place."
        />
      </section>
    </div>
  );
}
