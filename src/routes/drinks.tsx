import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDishFeed } from "@/lib/api/dishes";
import { DishGrid } from "@/components/dish-grid";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { dishIsDrink } from "@/lib/taxonomy";
import { breadcrumbList, collectionPage, jsonLd, seo } from "@/lib/seo";

const TITLE = "Drinks on FoodyPop — juices, brews and cocktails";
const DESCRIPTION =
  "Find drinks listed on FoodyPop, from fresh juices to local brews, with pricing and vendor details taken from each drink's published record.";
const PATH = "/drinks";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Drinks", path: PATH },
];

export const Route = createFileRoute("/drinks")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return {
      meta,
      links,
      scripts: [
        jsonLd(collectionPage({ name: "Drinks", description: DESCRIPTION, path: PATH })),
        jsonLd(breadcrumbList(CRUMBS)),
      ],
    };
  },
  component: DrinksHub,
});

function DrinksHub() {
  const feed = useQuery({
    queryKey: ["dishes", "feed", "hub"],
    queryFn: ({ signal }) => getDishFeed({ limit: 48 }, signal),
    retry: false,
  });

  const dishes = feed.data?.items.filter((d) => dishIsDrink(d) === true);

  return (
    <div className="grid gap-8">
      <Breadcrumbs crumbs={CRUMBS} />
      <header className="grid gap-3">
        <h1 className="text-4xl text-foreground">Drinks</h1>
        <p className="max-w-2xl text-muted-foreground">
          Drinks published by FoodyPop vendors. An item appears here only when its own record marks
          it as a drink — nothing is reclassified by guesswork.
        </p>
        <p className="text-sm text-muted-foreground">
          Looking for something else?{" "}
          <Link to="/food" className="underline">
            Food
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
        <h2 className="text-2xl text-foreground">Drinks</h2>
        <DishGrid
          dishes={dishes}
          isPending={feed.isPending}
          error={feed.isError ? feed.error : null}
          onRetry={() => feed.refetch()}
          emptyTitle="No drinks published yet"
          emptyHint="No item in the FoodyPop feed is marked as a drink. Nothing is substituted in its place."
        />
      </section>
    </div>
  );
}
