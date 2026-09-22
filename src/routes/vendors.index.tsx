import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listVendors } from "@/lib/api/vendors";
import { breadcrumbList, jsonLd, seo } from "@/lib/seo";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state";

export const Route = createFileRoute("/vendors/")({
  head: () => {
    const { meta, links } = seo({
      title: "Vendors on FoodyPop",
      description:
        "The kitchens and vendors publishing dishes on FoodyPop. Open a vendor to see who is behind the food you found.",
      path: "/vendors",
    });
    return {
      meta,
      links,
      scripts: [
        jsonLd(
          breadcrumbList([
            { name: "Home", path: "/" },
            { name: "Vendors", path: "/vendors" },
          ]),
        ),
      ],
    };
  },
  component: VendorsPage,
});

function VendorsPage() {
  const vendors = useQuery({
    queryKey: ["vendors"],
    queryFn: ({ signal }) => listVendors({ limit: 30 }, signal),
    retry: false,
  });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl text-foreground">Vendors</h1>
        <p className="text-sm text-muted-foreground">
          Vendors are supporting context for dishes.{" "}
          <span className="font-mono text-xs">GET /vendors</span>
        </p>
      </header>

      {vendors.isPending ? (
        <LoadingBlock label="Loading vendors" />
      ) : vendors.isError ? (
        <ErrorBlock error={vendors.error} onRetry={() => vendors.refetch()} />
      ) : vendors.data.items.length === 0 ? (
        <EmptyBlock title="The backend returned no vendors" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.data.items.map((v) => (
            <li key={v.id}>
              <Link
                to="/vendors/$vendorId"
                params={{ vendorId: v.id }}
                className="block rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-[var(--shadow-warm)]"
              >
                <p className="font-display text-lg text-foreground">
                  {v.name ?? v.displayName ?? v.id}
                </p>
                {v.location || v.address ? (
                  <p className="mt-1 text-sm text-muted-foreground">{v.location ?? v.address}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
