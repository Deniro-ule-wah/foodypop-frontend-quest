import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getDish } from "@/lib/api/dishes";
import { createFollow, UNFOLLOW_SUPPORTED } from "@/lib/api/follows";
import { ErrorBlock, GapNotice, LoadingBlock } from "@/components/state";
import { dishDisplayName, dishEffectivePrice, useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import type { Dish } from "@/lib/api/types";

/** Product taste vocabulary. Backend has no taste mutation — shown as unavailable. */
const TASTES = [
  "Delicious",
  "Sweet",
  "Bitter",
  "Sour",
  "Salty",
  "Spicy",
  "Refreshing",
  "Crispy",
  "Rich",
  "Filling",
];

export const Route = createFileRoute("/dishes/$dishId")({
  head: () => ({
    meta: [
      { title: "Dish — FoodyPop" },
      { name: "description", content: "Dish details served by the FoodyPop V2 backend." },
      { property: "og:title", content: "Dish — FoodyPop" },
      { property: "og:description", content: "Dish details served by the FoodyPop V2 backend." },
    ],
  }),
  component: DishDetail,
});

function Field({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  const text = Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return (
    <div className="border-b border-border py-2 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{text}</dd>
    </div>
  );
}

function DishDetail() {
  const { dishId } = Route.useParams();
  const { add } = useCart();
  const { token } = useSession();

  const dish = useQuery({
    queryKey: ["dish", dishId],
    queryFn: ({ signal }) => getDish(dishId, signal),
    retry: false,
  });

  const follow = useMutation({
    mutationFn: (d: Dish) => createFollow({ targetType: "DISH", targetId: d.id }),
  });

  if (dish.isPending) return <LoadingBlock label="Loading dish" />;
  if (dish.isError) return <ErrorBlock error={dish.error} onRetry={() => dish.refetch()} />;

  const d = dish.data;
  const image = (d.imageUrl as string) || (d.mediaUrl as string) || d.images?.[0] || null;
  const price = dishEffectivePrice(d);
  const cuisineName = typeof d.cuisine === "string" ? d.cuisine : d.cuisine?.name;
  const categoryName = typeof d.category === "string" ? d.category : d.category?.name;

  return (
    <div className="grid gap-8">
      <Link to="/" className="btn-ghost w-fit text-sm">
        ← Discover
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-border bg-muted">
          {image ? (
            <img src={image} alt={dishDisplayName(d)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
              No image returned by the backend
            </div>
          )}
        </div>

        <div className="grid content-start gap-4">
          <h1 className="text-4xl text-foreground">{dishDisplayName(d)}</h1>
          {d.description ? <p className="text-muted-foreground">{d.description}</p> : null}
          {price !== null ? (
            <p className="text-2xl font-semibold text-primary">
              {(d.currency as string) || "KES"} {price.toLocaleString()}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => add(d)}>
              Add to cart
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={!token || follow.isPending}
              onClick={() => follow.mutate(d)}
            >
              {follow.isPending ? "Following…" : "Follow dish"}
            </button>
          </div>
          {!token ? (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="underline">
                Sign in
              </Link>{" "}
              to follow dishes — the follow endpoint requires authentication.
            </p>
          ) : null}
          {follow.isError ? <ErrorBlock error={follow.error} /> : null}
          {follow.isSuccess ? (
            <p className="text-sm text-[color:var(--color-success)]">
              Backend accepted the follow request.
            </p>
          ) : null}
          {UNFOLLOW_SUPPORTED ? null : (
            <p className="text-xs text-muted-foreground">Unfollow is not exposed by the backend.</p>
          )}

          <dl className="rounded-2xl border border-border bg-card p-4">
            <Field
              label="Classification"
              value={d.kind ?? d.type ?? (d.isDrink ? "Drink" : null)}
            />
            <Field
              label="Cooked / raw"
              value={
                d.isCooked === null || d.isCooked === undefined
                  ? d.preparation
                  : d.isCooked
                    ? "Cooked"
                    : "Raw"
              }
            />
            <Field label="Ingredients" value={d.ingredients} />
            <Field label="Recipe" value={d.recipe} />
            <Field label="Cuisine" value={cuisineName} />
            <Field label="Category" value={categoryName} />
            <Field
              label="Availability"
              value={
                d.availability ??
                (d.isAvailable === undefined ? null : d.isAvailable ? "Available" : "Unavailable")
              }
            />
            <Field label="Location" value={d.location} />
            <Field label="Vendor" value={d.vendor?.name ?? d.vendor?.displayName ?? d.vendorId} />
          </dl>
        </div>
      </div>

      <section className="grid gap-3">
        <h2 className="text-2xl text-foreground">Taste reactions</h2>
        <GapNotice title="Taste interactions are unavailable">
          The backend exposes no taste mutation (
          <span className="font-mono">/dishes/:id/tastes</span> returns 404), so these are shown for
          reference only and nothing is recorded.
        </GapNotice>
        <ul className="flex flex-wrap gap-2">
          {TASTES.map((t) => (
            <li key={t}>
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled
                title="Backend capability unavailable"
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <details className="rounded-2xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          Raw backend payload
        </summary>
        <pre className="mt-3 overflow-x-auto font-mono text-xs text-muted-foreground">
          {JSON.stringify(d, null, 2)}
        </pre>
      </details>
    </div>
  );
}
