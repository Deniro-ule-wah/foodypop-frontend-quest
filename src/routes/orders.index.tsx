import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import { useSession } from "@/lib/session";
import { EmptyBlock, ErrorBlock, GapNotice, LoadingBlock } from "@/components/state";
import { PAYMENT_CONTRACT_GAP } from "@/lib/api/payments";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Your orders — FoodyPop" },
      { name: "description", content: "Orders created on the FoodyPop V2 backend, with their authoritative status." },
      { property: "og:title", content: "Your orders — FoodyPop" },
      { property: "og:description", content: "Track FoodyPop orders exactly as the backend reports them." },
    ],
  }),
  component: OrdersPage,
});

function normalize(payload: { items?: Order[] } | Order[] | null | undefined): Order[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

function OrdersPage() {
  const { token, ready } = useSession();

  const query = useQuery({
    queryKey: ["orders", token],
    queryFn: ({ signal }) => listOrders(signal),
    enabled: ready && Boolean(token),
    retry: false,
  });

  const orders = normalize(query.data);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Read directly from <span className="font-mono">GET /orders</span>. Status is whatever the backend reports —
          this client never advances it locally.
        </p>
      </header>

      {!ready ? (
        <LoadingBlock label="Restoring session" />
      ) : !token ? (
        <EmptyBlock
          title="Sign in to see your orders"
          hint="GET /orders requires authentication on the FoodyPop backend."
        />
      ) : query.isPending ? (
        <LoadingBlock label="Loading orders" />
      ) : query.isError ? (
        <ErrorBlock error={query.error} onRetry={() => query.refetch()} />
      ) : orders.length === 0 ? (
        <EmptyBlock title="No orders yet" hint="Create one from your cart once the backend has dishes." />
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-40 flex-1">
                  <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                  <p className="font-medium text-foreground">{order.status ?? order.state ?? "Status not provided"}</p>
                </div>
                {order.total !== undefined && order.total !== null ? (
                  <p className="text-sm text-muted-foreground">
                    {order.currency ?? ""} {String(order.total)}
                  </p>
                ) : null}
                <Link to="/orders/$orderId" params={{ orderId: order.id }} className="btn-secondary text-sm">
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <GapNotice title="Payment limits">
        <p>{PAYMENT_CONTRACT_GAP}</p>
      </GapNotice>
    </div>
  );
}
