import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/api/orders";
import { useSession } from "@/lib/session";
import { EmptyBlock, ErrorBlock, GapNotice } from "@/components/state";
import { PAYMENT_CONTRACT_GAP } from "@/lib/api/payments";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Cart — FoodyPop" },
      {
        name: "description",
        content: "Your local FoodyPop cart, before any backend order is created.",
      },
      { property: "og:title", content: "Cart — FoodyPop" },
      {
        property: "og:description",
        content: "Local cart and checkout against the FoodyPop V2 backend.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQuantity, remove, clear, subtotal } = useCart();
  const { token } = useSession();
  const navigate = useNavigate();
  /** Single-flight guard: prevents duplicate order creation on double-click/retry. */
  const inFlight = useRef(false);

  const checkout = useMutation({
    mutationFn: async () => {
      if (inFlight.current) throw new Error("An order submission is already in progress.");
      inFlight.current = true;
      try {
        return await createOrder({
          items: lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })),
        });
      } finally {
        inFlight.current = false;
      }
    },
    onSuccess: (order) => {
      clear();
      if (order?.id) navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
      else navigate({ to: "/orders" });
    },
  });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl text-foreground">Cart</h1>
        <p className="text-sm text-muted-foreground">
          This is <strong>local browser state</strong>. No backend order exists until the backend
          creates one.
        </p>
      </header>

      {lines.length === 0 ? (
        <EmptyBlock title="Your cart is empty" hint="Add a dish from the feed or search." />
      ) : (
        <>
          <ul className="grid gap-3">
            {lines.map((l) => (
              <li
                key={l.dishId}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="min-w-40 flex-1">
                  <p className="font-medium text-foreground">{l.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{l.dishId}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {l.unitPrice === null
                    ? "Price not provided"
                    : `${l.currency ?? "KES"} ${l.unitPrice.toLocaleString()}`}
                </p>
                <input
                  type="number"
                  min={1}
                  className="field w-20"
                  aria-label={`Quantity for ${l.name}`}
                  value={l.quantity}
                  onChange={(e) => setQuantity(l.dishId, Number(e.target.value))}
                />
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={() => remove(l.dishId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-foreground">
              Subtotal:{" "}
              {subtotal === null ? (
                <span className="text-muted-foreground">
                  unavailable — the backend did not price every item
                </span>
              ) : (
                <strong>{subtotal.toLocaleString()}</strong>
              )}
            </p>
            <div className="ml-auto flex gap-2">
              <button type="button" className="btn-secondary" onClick={clear}>
                Clear cart
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!token || checkout.isPending}
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending ? "Creating order…" : "Create order"}
              </button>
            </div>
          </div>

          {!token ? (
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="underline">
                Sign in
              </Link>{" "}
              to create an order — <span className="font-mono">POST /orders</span> requires
              authentication.
            </p>
          ) : null}
          {checkout.isError ? <ErrorBlock error={checkout.error} /> : null}
        </>
      )}

      <GapNotice title="Checkout &amp; payment limits">
        <p>
          The exact <span className="font-mono">POST /orders</span> body is not documented by the
          backend; this client sends the cart items and shows the backend's own validation response
          unchanged.
        </p>
        <p className="mt-2">{PAYMENT_CONTRACT_GAP}</p>
      </GapNotice>
    </div>
  );
}
