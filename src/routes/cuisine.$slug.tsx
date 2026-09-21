import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDishFeed } from "@/lib/api/dishes";
import { listCuisines } from "@/lib/api/vendors";
import { DishGrid } from "@/components/dish-grid";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { refMatches, taxonomyId, taxonomyName } from "@/lib/taxonomy";
import { dishCuisine } from "@/lib/taxonomy";
import { idFromSlug } from "@/lib/slug";
import { breadcrumbList, collectionPage, jsonLd, seo } from "@/lib/seo";
import type { Taxonomy } from "@/lib/api/types";

export const Route = createFileRoute("/cuisine/$slug")({
  loader: async ({ params }) => {
    const id = idFromSlug(params.slug);
    const cuisines = await listCuisines();
    const match = (cuisines ?? []).find(
      (c) => taxonomyId(c) === id || taxonomyName(c).toLowerCase() === id.toLowerCase(),
    );
    if (!match) throw notFound();
    return { cuisine: match as Taxonomy };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Cuisine unavailable — FoodyPop" }, { name: "robots", content: "noindex" }],
      };
    }
    const name = taxonomyName(loaderData.cuisine);
    const path = `/cuisine/${params.slug}`;
    const title = `${name} Food & Dishes | FoodyPop`;
    const description = `Dishes and drinks published under ${name} cuisine on FoodyPop, with pricing and vendor details from each listing.`;
    const { meta, links } = seo({ title, description, path });
    return {
      meta,
      links,
      scripts: [
        jsonLd(collectionPage({ name: `${name} cuisine`, description, path })),
        jsonLd(
          breadcrumbList([
            { name: "Home", path: "/" },
            { name: "Cuisines", path: "/cuisines" },
            { name, path },
          ]),
        ),
      ],
    };
  },
  component: CuisinePage,
});

function CuisinePage() {
  const { slug } = Route.useParams();
  const { cuisine } = Route.useLoaderData();
  const name = taxonomyName(cuisine);

  const feed = useQuery({
    queryKey: ["dishes", "feed", "hub"],
    queryFn: ({ signal }) => getDishFeed({ limit: 48 }, signal),
    retry: false,
  });

  const dishes = feed.data?.items.filter((d) => refMatches(dishCuisine(d), cuisine));

  return (
    <div className="grid gap-8">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Cuisines", path: "/cuisines" },
          { name, path: `/cuisine/${slug}` },
        ]}
      />
      <header className="grid gap-3">
        <h1 className="text-4xl text-foreground">{name}</h1>
        {typeof cuisine.description === "string" && cuisine.description ? (
          <p className="max-w-2xl text-muted-foreground">{cuisine.description}</p>
        ) : (
          <p className="max-w-2xl text-muted-foreground">
            Dishes and drinks that FoodyPop vendors publish under {name}.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          <Link to="/cuisines" className="underline">
            All cuisines
          </Link>
          {" · "}
          <Link to="/categories" className="underline">
            Categories
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
          emptyHint="No dish in the FoodyPop feed carries this cuisine. Nothing is invented to fill the page."
        />
      </section>
    </div>
  );
}
