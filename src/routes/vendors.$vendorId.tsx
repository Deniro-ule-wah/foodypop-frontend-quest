import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getVendor } from "@/lib/api/vendors";
import { seo } from "@/lib/seo";
import { ErrorBlock, GapNotice, LoadingBlock } from "@/components/state";

export const Route = createFileRoute("/vendors/$vendorId")({
  head: ({ params }) => {
    const { meta, links } = seo({
      title: "Vendor on FoodyPop",
      description:
        "A FoodyPop vendor page: who they are, where they are, and how their dishes reach you.",
      path: `/vendors/${params.vendorId}`,
    });
    return { meta, links };
  },
  component: VendorDetail,
});

function VendorDetail() {
  const { vendorId } = Route.useParams();
  const vendor = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: ({ signal }) => getVendor(vendorId, signal),
    retry: false,
  });

  if (vendor.isPending) return <LoadingBlock label="Loading vendor" />;
  if (vendor.isError) return <ErrorBlock error={vendor.error} onRetry={() => vendor.refetch()} />;

  const v = vendor.data;
  return (
    <div className="grid gap-6">
      <Link to="/vendors" className="btn-ghost w-fit text-sm">
        ← All vendors
      </Link>
      <h1 className="text-3xl text-foreground">{v.name ?? v.displayName ?? v.id}</h1>
      {v.location || v.address ? (
        <p className="text-muted-foreground">{v.location ?? v.address}</p>
      ) : null}
      {v.description ? <p className="max-w-2xl text-foreground">{v.description}</p> : null}

      <GapNotice title="Vendor dish listing unavailable">
        The backend exposes no per-vendor dish endpoint (
        <span className="font-mono">GET /vendors/:id/dishes</span> returns 404). Use search or the
        dish feed instead.
      </GapNotice>

      <details className="rounded-2xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          Raw backend payload
        </summary>
        <pre className="mt-3 overflow-x-auto font-mono text-xs text-muted-foreground">
          {JSON.stringify(v, null, 2)}
        </pre>
      </details>
    </div>
  );
}
