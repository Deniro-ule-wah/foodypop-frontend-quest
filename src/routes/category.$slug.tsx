import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDishFeed } from "@/lib/api/dishes";
import { listCategories } from "@/lib/api/vendors";
import { DishGrid } from "@/components/dish-grid";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { dishCategory, refMatches, taxonomyId, taxonomyName } from "@/lib/taxonomy";
import { idFromSlug } from "@/lib/slug";
import { breadcrumbList, collectionPage, jsonLd, seo } from "@/lib/seo";
import type { Taxonomy } from "@/lib/api/types";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const id = idFromSlug(params.slug);
    const categories = await listCategories();
    const match = (categories ?? []).find(
      (c) => taxonomyId(c) === id || taxonomyName(c).toLowerCase() === id.toLowerCase(),
    );
    if (!match) throw notFound();
    return { category: match as Taxonomy };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Category unavailable — FoodyPop" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const name = taxonomyName(loaderData.category);
    const path = `/category/${params.slug}`;
    const title = `${name} on FoodyPop | Dishes & Drinks`;
    const description = `Dishes and drinks published in the ${name} category on FoodyPop, with pricing and vendor details from each listing.`;
    const { meta, links } = seo({ title, description, path });
    return {
      meta,
      links,
      scripts: [
        jsonLd(collectionPage({ name: `${name} category`, description, path })),
        jsonLd(
          breadcrumbList([
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
            { name, path },
          ]),
        ),
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { category } = Route.useLoaderData();
  const name = taxonomyName(category);

  const feed = useQuery({
    queryKey: ["dishes", "feed", "hub"],
    queryFn: ({ signal }) => getDishFeed({ limit: 48 }, signal),
    retry: false,
  });

  const dishes = feed.data?.items.filter((d) => refMatches(dishCategory(d), category));

  return (
    <div className="grid gap-8">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name, path: `/category/${slug}` },
        ]}
      />
      <header className="grid gap-3">
        <h1 className="text-4xl text-foreground">{name}</h1>
        {typeof category["description"] === "string" && category["description"] ? (
          <p className="max-w-2xl text-muted-foreground">{String(category["description"])}</p>
        ) : (
          <p className="max-w-2xl text-muted-foreground">
            Everything FoodyPop vendors publish in the {name} category.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          <Link to="/categories" className="underline">
            All categories
          </Link>
          {" · "}
          <Link to="/cuisines" className="underline">
            Cuisines
          </Link>
          {" · "}
          <Link to="/dishes" className="underline">
            All dishes
          </Link>
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-2xl text-foreground">Dishes in {name}</h2>
        <DishGrid
          dishes={dishes}
          isPending={feed.isPending}
          error={feed.isError ? feed.error : null}
          onRetry={() => feed.refetch()}
          emptyTitle={`No ${name} dishes published yet`}
          emptyHint="No dish in the FoodyPop feed carries this category. Nothing is invented to fill the page."
        />
      </section>
    </div>
  );
}
