import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCuisines } from "@/lib/api/vendors";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { taxonomyId, taxonomyName } from "@/lib/taxonomy";
import { entitySlug } from "@/lib/slug";
import { breadcrumbList, collectionPage, jsonLd, seo } from "@/lib/seo";

const TITLE = "Cuisines on FoodyPop";
const DESCRIPTION =
  "Every cuisine represented on FoodyPop. Open a cuisine to see the dishes and drinks published under it by local vendors.";
const PATH = "/cuisines";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Cuisines", path: PATH },
];

export const Route = createFileRoute("/cuisines")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return {
      meta,
      links,
      scripts: [
        jsonLd(collectionPage({ name: "Cuisines", description: DESCRIPTION, path: PATH })),
        jsonLd(breadcrumbList(CRUMBS)),
      ],
    };
  },
  component: CuisinesPage,
});

function CuisinesPage() {
  const cuisines = useQuery({
    queryKey: ["cuisines"],
    queryFn: ({ signal }) => listCuisines(signal),
    retry: false,
  });

  return (
    <div className="grid gap-8">
      <Breadcrumbs crumbs={CRUMBS} />
      <header className="grid gap-3">
        <h1 className="text-4xl text-foreground">Cuisines</h1>
        <p className="max-w-2xl text-muted-foreground">
          Cuisines come from FoodyPop itself — only cuisines that actually exist on the platform are
          listed here.
        </p>
      </header>

      {cuisines.isPending ? (
        <LoadingBlock label="Loading cuisines" />
      ) : cuisines.isError ? (
        <ErrorBlock error={cuisines.error} onRetry={() => cuisines.refetch()} />
      ) : !cuisines.data || cuisines.data.length === 0 ? (
        <EmptyBlock
          title="No cuisines published yet"
          hint="FoodyPop returned an empty cuisine list. No placeholder cuisines are shown."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cuisines.data.map((c) => (
            <li key={taxonomyId(c)}>
              <Link
                to="/cuisine/$slug"
                params={{ slug: entitySlug(taxonomyId(c), taxonomyName(c)) }}
                className="block rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-warm)]"
              >
                <h2 className="font-display text-lg text-foreground">{taxonomyName(c)}</h2>
                <p className="text-sm text-muted-foreground">See dishes in this cuisine</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
