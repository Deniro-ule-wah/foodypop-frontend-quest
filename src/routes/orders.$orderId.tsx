import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cancelOrder, createPaymentAttempt, getOrder, getPickupCode } from "@/lib/api/orders";
import { ORDER_STATES } from "@/lib/api/types";
import type { Order } from "@/lib/api/types";
import { PAYMENT_CONTRACT_GAP, paymentStateCopy, readPaymentState } from "@/lib/api/payments";
import { useSession } from "@/lib/session";
import { EmptyBlock, ErrorBlock, GapNotice, LoadingBlock } from "@/components/state";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Order detail — FoodyPop" },
      {
        name: "description",
        content: "Backend-authoritative FoodyPop order status and payment state.",
      },
      { property: "og:title", content: "Order detail — FoodyPop" },
      {
        property: "og:description",
        content: "Follow a FoodyPop order through the backend's own lifecycle states.",
      },
    ],
  }),
  component: OrderDetailPage,
});

/** Reads payment state from whatever the backend embedded on the order. Never invents one. */
function paymentStatesOf(order: Order): string[] {
  const out: string[] = [];
  const direct = readPaymentState((order.payment as Record<string, unknown> | null)?.["status"]);
  if (direct) out.push(direct);
  for (const attempt of order.paymentAttempts ?? []) {
    const s = readPaymentState(attempt?.["status"] ?? attempt?.["state"]);
    if (s) out.push(s);
  }
  return out;
}

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { token, ready } = useSession();
  const queryClient = useQueryClient();
  const [phoneValue, setPhoneValue] = useState("");

  const query = useQuery({
    queryKey: ["order", orderId, token],
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: ready && Boolean(token),
    retry: false,
  });

  const cancel = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
  });

  const initPayment = useMutation({
    mutationFn: () => createPaymentAttempt(orderId, phoneValue, crypto.randomUUID()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
  });

  const order = query.data;
  const currentStatus = order?.status ?? order?.state ?? null;
  const pickupCodeQuery = useQuery({
    queryKey: ["order", orderId, "pickup-code", token],
    queryFn: ({ signal }) => getPickupCode(orderId, signal),
    enabled: ready && Boolean(token) && currentStatus === "READY_FOR_PICKUP",
    retry: false,
  });

  const rawPickupCode =
    pickupCodeQuery.data && typeof pickupCodeQuery.data === "object"
      ? (pickupCodeQuery.data as Record<string, unknown>)["code"]
      : null;
  const pickupCode = typeof rawPickupCode === "string" ? rawPickupCode : null;

  const currentIndex = currentStatus
    ? ORDER_STATES.indexOf(currentStatus as (typeof ORDER_STATES)[number])
    : -1;
  const payments = order ? paymentStatesOf(order) : [];

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link to="/orders" className="text-sm text-muted-foreground underline">
          ← All orders
        </Link>
        <h1 className="text-3xl text-foreground">Order</h1>
        <p className="font-mono text-xs text-muted-foreground">
          {orderId} · GET /orders/{"{"}id{"}"}
        </p>
      </header>

      {!ready ? (
        <LoadingBlock label="Restoring session" />
      ) : !token ? (
        <EmptyBlock
          title="Sign in to view this order"
          hint="This endpoint requires authentication."
        />
      ) : query.isPending ? (
        <LoadingBlock label="Loading order" />
      ) : query.isError ? (
        <ErrorBlock error={query.error} onRetry={() => query.refetch()} />
      ) : !order ? (
        <EmptyBlock title="The backend returned no order payload" />
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Backend status</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {currentStatus ?? "Not provided"}
            </p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {ORDER_STATES.map((state, i) => {
                const reached = currentIndex >= 0 && i <= currentIndex;
                return (
                  <li
                    key={state}
                    className={`rounded-xl border px-3 py-2 text-xs ${
                      reached
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {state}
                  </li>
                );
              })}
            </ol>
            {currentIndex < 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                The backend reported a status outside the documented lifecycle — shown verbatim
                above.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg text-foreground">Payment</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                The backend reported no payment state on this order. Nothing is assumed.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {payments.map((state, i) => {
                  const copy = paymentStateCopy(state as Parameters<typeof paymentStateCopy>[0]);
                  return (
                    <li key={`${state}-${i}`} className="rounded-xl border border-border p-3">
                      <p className="text-sm font-medium text-foreground">
                        {copy.label}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          {state} · {copy.terminal ? "terminal" : "non-terminal"}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">{copy.note}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            {currentStatus === "PENDING_PAYMENT" && !token ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Sign in to initiate payment for this order.
              </p>
            ) : currentStatus === "PENDING_PAYMENT" && token ? (
              <form
                className="mt-4 rounded-xl border border-border bg-muted/40 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!initPayment.isPending && phoneValue.trim().length >= 9) {
                    initPayment.mutate();
                  }
                }}
              >
                <p className="text-sm text-muted-foreground">
                  Initiate payment through the backend's payment-attempts endpoint.
                </p>
                <label className="mt-3 grid gap-1 text-sm">
                  M-Pesa phone number
                  <input
                    className="field"
                    type="tel"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    placeholder="254712345678"
                    autoComplete="tel-national"
                    required
                    minLength={9}
                  />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {phoneValue.trim().length >= 9
                    ? "Valid length"
                    : phoneValue.length > 0
                      ? "Need at least 9 digits"
                      : "Enter your M-Pesa number"}
                </p>
                <button
                  type="submit"
                  className="btn-primary mt-3"
                  disabled={initPayment.isPending || phoneValue.trim().length < 9}
                >
                  {initPayment.isPending ? "Initiating payment…" : "Initiate payment"}
                </button>
                {initPayment.isError ? <ErrorBlock error={initPayment.error} /> : null}
                {initPayment.isSuccess ? (
                  <p className="mt-3 text-sm text-foreground">
                    Payment attempt initiated. Refresh to see the backend's recorded state.
                  </p>
                ) : null}
              </form>
            ) : null}
          </section>

          {order.items && order.items.length > 0 ? (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg text-foreground">Items</h2>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-muted p-3 font-mono text-xs text-muted-foreground">
                {JSON.stringify(order.items, null, 2)}
              </pre>
            </section>
          ) : null}

          {currentStatus === "READY_FOR_PICKUP" && pickupCode ? (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg text-foreground">Pickup code</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Show this code to the vendor when you arrive.
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-mono text-2xl font-bold text-foreground tracking-wider">
                  {pickupCode}
                </p>
                <button
                  type="button"
                  className="ml-auto btn-secondary"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(pickupCode).then(
                        () => {},
                        () => {},
                      );
                    }
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                GET /orders/{"{"}id{"}"}/pickup-code
              </p>
            </section>
          ) : null}

          {currentStatus === "READY_FOR_PICKUP" && pickupCode ? (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg text-foreground">Pickup code</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Show this code to the vendor when you arrive.
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-mono text-2xl font-bold text-foreground tracking-wider">
                  {pickupCode}
                </p>
                <button
                  type="button"
                  className="ml-auto btn-secondary"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(pickupCode).then(
                        () => {},
                        () => {},
                      );
                    }
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                GET /orders/{"{"}id{"}"}/pickup-code
              </p>
            </section>
          ) : null}

          <section className="grid gap-3">
            <button
              type="button"
              className="btn-secondary w-fit"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel order"}
            </button>
            <p className="font-mono text-xs text-muted-foreground">
              POST /orders/{"{"}id{"}"}/cancel
            </p>
            {cancel.isError ? <ErrorBlock error={cancel.error} /> : null}
          </section>

          <details className="rounded-2xl border border-border bg-card p-5">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Raw backend payload
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-muted p-3 font-mono text-xs text-muted-foreground">
              {JSON.stringify(order, null, 2)}
            </pre>
          </details>
        </>
      )}

      <GapNotice title="Payment limits">
        <p>{PAYMENT_CONTRACT_GAP}</p>
      </GapNotice>
    </div>
  );
}
