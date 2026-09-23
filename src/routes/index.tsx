import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getDishFeed } from "@/lib/api/dishes";
import { listCategories, listCuisines } from "@/lib/api/vendors";
import { DishCard } from "@/components/dish-card";
import { BrandLogo } from "@/components/brand-logo";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state";
import { entitySlug } from "@/lib/slug";
import { taxonomyId, taxonomyName } from "@/lib/taxonomy";
import { breadcrumbList, jsonLd, seo, SITE_NAME, SITE_URL } from "@/lib/seo";
import type { Taxonomy } from "@/lib/api/types";

const TITLE = "FoodyPop — discover food and drinks worth trying";
const DESCRIPTION =
  "FoodyPop is dish-first food discovery: browse dishes and drinks from local vendors, explore cuisines and categories, and order what you find.";

export const Route = createFileRoute("/")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: "/" });
    return {
      meta,
      links,
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description: DESCRIPTION,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }),
        jsonLd(breadcrumbList([{ name: "Home", path: "/" }])),
      ],
    };
  },
  component: HomePage,
});

const HUBS = [
  { to: "/food", label: "Food", blurb: "Plates, grills and street food" },
  { to: "/drinks", label: "Drinks", blurb: "Juices, brews and cocktails" },
  { to: "/dishes", label: "All dishes", blurb: "Everything published so far" },
  { to: "/cuisines", label: "Cuisines", blurb: "Browse by kitchen tradition" },
  { to: "/categories", label: "Categories", blurb: "Browse by kind of dish" },
  { to: "/vendors", label: "Vendors", blurb: "The kitchens behind the dishes" },
] as const;

function HomePage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [intentReady, setIntentReady] = useState(false);
  const [budget, setBudget] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    try {
      setIntent(window.sessionStorage.getItem("foodypop.intent"));
    } catch {
      /* ignore */
    }
    setIntentReady(true);
  }, []);

  const feed = useQuery({
    queryKey: ["dishes", "feed", "hub", intent, budget],
    queryFn: ({ signal }) =>
      getDishFeed(
        {
          limit: 48,
          maxBudget: budget ?? undefined,
          kind: intent === "thirsty" ? "DRINK" : undefined,
        },
        signal,
      ),
    retry: false,
  });

  const cuisines = useQuery({
    queryKey: ["cuisines"],
    queryFn: ({ signal }) => listCuisines(signal),
    retry: false,
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => listCategories(signal),
    retry: false,
  });

  return (
    <div className="grid gap-12">
      {/* Intent onboarding: show selector for first-time visitors. */}
      {!intentReady ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse h-10 rounded-xl bg-muted" />
        </div>
      ) : !intent ? (
        <IntentSelector
          onChoose={(id) => {
            try {
              window.sessionStorage.setItem("foodypop.intent", id);
            } catch {
              /* ignore */
            }
            setIntent(id);
          }}
          onSkip={() => {
            try {
              window.sessionStorage.removeItem("foodypop.intent");
            } catch {
              /* ignore */
            }
            setIntent("discover");
          }}
        />
      ) : intent === "vendor" ? null : (
        <>
          <section className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-warm)] sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Dish first</p>
            <h1 className="mt-3 max-w-2xl text-4xl leading-tight text-foreground sm:text-5xl">
              Discover food and drinks worth trying.
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Start with the dish, not the restaurant. Search a plate you are craving, or browse by
              cuisine and category — the vendor comes with the food.
            </p>

            {/* Hungry intent: show budget + distance context */}
            {intent === "hungry" ? (
              <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
                <h2 className="text-sm font-semibold text-foreground">Hungry — find food near you</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Filter by what fits your budget and how far you're willing to go.
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {BUDGET_PRESETS.map((b) => (
                        <button
                          key={b.value}
                          type="button"
                          className={`rounded-full px-3 py-1 text-sm ${budget === b.value ? "btn-primary" : "btn-ghost"}`}
                          onClick={() => setBudget(b.value)}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {DISTANCE_PRESETS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          className={`rounded-full px-3 py-1 text-sm ${distance === d.value ? "btn-primary" : "btn-ghost"}`}
                          onClick={() => setDistance(d.value)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <form
              role="search"
              className="mt-6 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const q = term.trim();
                if (q) navigate({ to: "/search", search: { q } });
              }}
            >
              <label htmlFor="home-search" className="sr-only">
                Search dishes and drinks
              </label>
              <input
                id="home-search"
                name="q"
                type="search"
                className="field w-full max-w-md"
                placeholder="pilau, samosa, dawa cocktail…"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={term.trim().length === 0}>
                Search
              </button>
            </form>
          </section>

      <section className="grid gap-4">
        <h2 className="text-2xl text-foreground">Browse FoodyPop</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HUBS.map((hub) => (
            <li key={hub.to}>
              <Link
                to={hub.to}
                className="block rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-warm)]"
              >
                <h3 className="font-display text-lg text-foreground">{hub.label}</h3>
                <p className="text-sm text-muted-foreground">{hub.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl text-foreground">Latest dishes</h2>
          <Link to="/dishes" className="text-sm underline">
            See all
          </Link>
        </div>
        {feed.isPending ? (
          <LoadingBlock label="Loading dishes" />
        ) : feed.isError ? (
          <ErrorBlock error={feed.error} onRetry={() => feed.refetch()} />
        ) : feed.data.items.length === 0 ? (
          <EmptyBlock
            title="No dishes published yet"
            hint="FoodyPop returned an empty feed. Nothing is substituted in its place."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feed.data.items.slice(0, 12).map((dish, i) => (
              <DishCard key={dish.id} dish={dish} priority={i < 3} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TaxonomyPanel
          title="Cuisines"
          items={cuisines.data}
          isPending={cuisines.isPending}
          isError={cuisines.isError}
          kind="cuisine"
        />
        <TaxonomyPanel
          title="Categories"
          items={categories.data}
          isPending={categories.isPending}
          isError={categories.isError}
          kind="category"
        />
      </section>
      </>
      )}
    </div>
  );
}

function TaxonomyPanel({
  title,
  items,
  isPending,
  isError,
  kind,
}: {
  title: string;
  items: Taxonomy[] | undefined;
  isPending: boolean;
  isError: boolean;
  kind: "cuisine" | "category";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl text-foreground">{title}</h2>
        <Link to={kind === "cuisine" ? "/cuisines" : "/categories"} className="text-sm underline">
          All {title.toLowerCase()}
        </Link>
      </div>
      <div className="mt-4">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            {title} could not be loaded right now. Try again shortly.
          </p>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing published yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {items.map((t) => (
              <li key={taxonomyId(t)}>
                {kind === "cuisine" ? (
                  <Link
                    to="/cuisine/$slug"
                    params={{ slug: entitySlug(taxonomyId(t), taxonomyName(t)) }}
                    className="rounded-full bg-muted px-3 py-1 text-sm text-foreground hover:bg-accent"
                  >
                    {taxonomyName(t)}
                  </Link>
                ) : (
                  <Link
                    to="/category/$slug"
                    params={{ slug: entitySlug(taxonomyId(t), taxonomyName(t)) }}
                    className="rounded-full bg-muted px-3 py-1 text-sm text-foreground hover:bg-accent"
                  >
                    {taxonomyName(t)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const BUDGET_PRESETS = [
  { label: "KES 250", value: 250 },
  { label: "KES 500", value: 500 },
  { label: "KES 1,000", value: 1000 },
  { label: "KES 2,000+", value: 2000 },
];

const DISTANCE_PRESETS = [
  { label: "Any distance", value: 0 },
  { label: "Within 5 km", value: 5 },
  { label: "Within 10 km", value: 10 },
  { label: "Within 20 km", value: 20 },
];

const INTENT_OPTIONS = [
  {
    id: "discover",
    title: "Discover",
    blurb: "Explore dishes and drinks.",
    description: "Browse by cuisine, category, and taste. Find something new.",
  },
  {
    id: "hungry",
    title: "Hungry",
    blurb: "Find something to eat now.",
    description: "Filter by what's nearby, affordable, and available.",
  },
  {
    id: "thirsty",
    title: "Thirsty",
    blurb: "Find something to drink.",
    description: "Soda, tea, coffee, juice, milkshake — whatever you're craving.",
  },
  {
    id: "vendor",
    title: "Vendor",
    blurb: "Manage your dishes and orders.",
    description: "For food vendors: list dishes, accept orders, manage pickup.",
  },
];

function IntentSelector({
  onChoose,
  onSkip,
}: {
  onChoose: (id: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-center gap-3 text-center">
        <BrandLogo size="sm" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          FoodyPop
        </p>
      </div>
      <h1 className="mt-2 text-center text-3xl font-display leading-tight text-foreground sm:text-4xl">
        What are you looking for?
      </h1>
      <p className="mt-2 text-center max-w-lg text-muted-foreground">
        Tell us what you want and we'll show you the right dishes.
      </p>

      <dl className="grid gap-4 sm:grid-cols-2">
        {INTENT_OPTIONS.map((intent) => (
          <div
            key={intent.id}
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 transition hover:shadow-[var(--shadow-warm)]"
          >
            <dd className="grid gap-2">
              <dt className="text-xl font-semibold text-foreground">{intent.title}</dt>
              <p className="text-sm text-muted-foreground">{intent.blurb}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{intent.description}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onChoose(intent.id)}
                >
                  {intent.title}
                </button>
                {intent.id === "vendor" ? (
                  <Link to="/vendors" className="btn-ghost">
                    Go to vendors
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={onSkip}
                  >
                    Skip
                  </button>
                )}
              </div>
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-center text-sm text-muted-foreground">
        <button
          type="button"
          className="underline hover:text-foreground"
          onClick={onSkip}
        >
          Skip — show me everything
        </button>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Your choice is remembered for this browser session.
      </p>
    </div>
  );
}

