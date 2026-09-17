import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDishFeed } from "@/lib/api/dishes";
import { listCategories, listCuisines } from "@/lib/api/vendors";
import { DishCard } from "@/components/dish-card";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodyPop — Discover dishes, drinks and cuisines" },
      {
        name: "description",
        content:
          "Browse the FoodyPop dish feed, search food and drinks, and track orders against the live FoodyPop V2 backend.",
      },
      { property: "og:title", content: "FoodyPop — Discover dishes, drinks and cuisines" },
      {
        property: "og:description",
        content: "Dish-first food discovery powered by the live FoodyPop V2 backend.",
      },
    ],
  }),
  component: DiscoveryPage,
});

function DiscoveryPage() {
  const { ready } = useSession();

  const feed = useQuery({
    queryKey: ["dishes", "feed"],
    queryFn: ({ signal }) => getDishFeed({ limit: 24 }, signal),
    enabled: ready,
    retry: false,
  });

  const cuisines = useQuery({
    queryKey: ["cuisines"],
    queryFn: ({ signal }) => listCuisines(signal),
    enabled: ready,
    retry: false,
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => listCategories(signal),
    enabled: ready,
    retry: false,
  });

  return (
    <div className="grid gap-10">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-warm)] sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Dish first</p>
        <h1 className="mt-3 max-w-2xl text-4xl leading-tight text-foreground sm:text-5xl">
          Find the food, not the feed.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Every dish, drink and cuisine below comes straight from the live FoodyPop backend. Nothing
          is simulated here.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/search" className="btn-primary">
            Search dishes
          </Link>
          <Link to="/vendors" className="btn-secondary">
            Browse vendors
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl text-foreground">Dish feed</h2>
          <span className="font-mono text-xs text-muted-foreground">GET /dishes/feed</span>
        </div>
        {!ready || feed.isPending ? (
          <LoadingBlock label="Loading dishes" />
        ) : feed.isError ? (
          <ErrorBlock error={feed.error} onRetry={() => feed.refetch()} />
        ) : feed.data.items.length === 0 ? (
          <EmptyBlock
            title="The backend returned no dishes"
            hint="The feed responded successfully with an empty list. Nothing is substituted in its place."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feed.data.items.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TaxonomyPanel title="Cuisines" endpoint="GET /cuisines" query={cuisines} />
        <TaxonomyPanel title="Categories" endpoint="GET /categories" query={categories} />
      </section>
    </div>
  );
}

function TaxonomyPanel({
  title,
  endpoint,
  query,
}: {
  title: string;
  endpoint: string;
  query: ReturnType<typeof useQuery<Array<{ id?: string; name?: string }>>>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl text-foreground">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground">{endpoint}</span>
      </div>
      <div className="mt-4">
        {query.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : query.isError ? (
          <ErrorBlock error={query.error} onRetry={() => query.refetch()} />
        ) : !query.data || query.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Backend returned an empty list.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {query.data.map((t, i) => (
              <li
                key={t.id ?? i}
                className="rounded-full bg-muted px-3 py-1 text-sm text-foreground"
              >
                {t.name ?? t.id}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
