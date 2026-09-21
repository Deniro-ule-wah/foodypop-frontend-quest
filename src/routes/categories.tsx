import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/api/vendors";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { taxonomyId, taxonomyName } from "@/lib/taxonomy";
import { entitySlug } from "@/lib/slug";
import { breadcrumbList, collectionPage, jsonLd, seo } from "@/lib/seo";

const TITLE = "Food & drink categories on FoodyPop";
const DESCRIPTION =
  "Browse FoodyPop by category. Each category page lists the dishes and drinks vendors have published under it.";
const PATH = "/categories";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Categories", path: PATH },
];

export const Route = createFileRoute("/categories")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return {
      meta,
      links,
      scripts: [
        jsonLd(collectionPage({ name: "Categories", description: DESCRIPTION, path: PATH })),
        jsonLd(breadcrumbList(CRUMBS)),
      ],
    };
  },
  component: CategoriesPage,
});

function CategoriesPage() {
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => listCategories(signal),
    retry: false,
  });

  return (
    <div className="grid gap-8">
      <Breadcrumbs crumbs={CRUMBS} />
      <header className="grid gap-3">
        <h1 className="text-4xl text-foreground">Categories</h1>
        <p className="max-w-2xl text-muted-foreground">
          Categories are defined on FoodyPop. Only categories that exist on the platform appear
          here.
        </p>
      </header>

      {categories.isPending ? (
        <LoadingBlock label="Loading categories" />
      ) : categories.isError ? (
        <ErrorBlock error={categories.error} onRetry={() => categories.refetch()} />
      ) : !categories.data || categories.data.length === 0 ? (
        <EmptyBlock
          title="No categories published yet"
          hint="FoodyPop returned an empty category list. No placeholder categories are shown."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data.map((c) => (
            <li key={taxonomyId(c)}>
              <Link
                to="/category/$slug"
                params={{ slug: entitySlug(taxonomyId(c), taxonomyName(c)) }}
                className="block rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-warm)]"
              >
                <h2 className="font-display text-lg text-foreground">{taxonomyName(c)}</h2>
                <p className="text-sm text-muted-foreground">See dishes in this category</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
