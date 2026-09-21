import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDishFeed } from "@/lib/api/dishes";
import { DishGrid } from "@/components/dish-grid";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { breadcrumbList, collectionPage, jsonLd, seo } from "@/lib/seo";

const TITLE = "All dishes on FoodyPop";
const DESCRIPTION =
  "The full FoodyPop dish feed: food and drinks published by local vendors, each with its own page showing details, pricing and where to find it.";
const PATH = "/dishes";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Dishes", path: PATH },
];

export const Route = createFileRoute("/dishes/")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return {
      meta,
      links,
      scripts: [
        jsonLd(collectionPage({ name: "Dishes", description: DESCRIPTION, path: PATH })),
        jsonLd(breadcrumbList(CRUMBS)),
      ],
    };
  },
  component: DishesIndex,
});

function DishesIndex() {
  const feed = useQuery({
    queryKey: ["dishes", "feed", "hub"],
    queryFn: ({ signal }) => getDishFeed({ limit: 48 }, signal),
    retry: false,
  });

  return (
    <div className="grid gap-8">
      <Breadcrumbs crumbs={CRUMBS} />
      <header className="grid gap-3">
        <h1 className="text-4xl text-foreground">Dishes</h1>
        <p className="max-w-2xl text-muted-foreground">
          Everything currently published on FoodyPop, food and drinks together. Narrow it down by{" "}
          <Link to="/cuisines" className="underline">
            cuisine
          </Link>{" "}
          or{" "}
          <Link to="/categories" className="underline">
            category
          </Link>
          .
        </p>
      </header>

      <DishGrid
        dishes={feed.data?.items}
        isPending={feed.isPending}
        error={feed.isError ? feed.error : null}
        onRetry={() => feed.refetch()}
        emptyTitle="No dishes published yet"
        emptyHint="The FoodyPop dish feed responded with an empty list."
      />
    </div>
  );
}
