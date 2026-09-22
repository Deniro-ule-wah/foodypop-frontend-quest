import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SITE_NAME } from "@/lib/seo";

const INTENTS = [
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

export const Route = createFileRoute("/intent")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
      { title: `What are you looking for? — ${SITE_NAME}` },
      {
        name: "description",
        content: "Tell FoodyPop what you're looking for and we'll show you the right dishes.",
      },
    ],
  }),
  component: IntentPage,
});

function IntentPage() {
  const navigate = useNavigate();
  const [chosen, setChosen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Read a previously chosen intent from session storage on mount.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("foodypop.intent");
      if (saved) setChosen(saved);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const handleChoose = (id: string) => {
    try {
      window.sessionStorage.setItem("foodypop.intent", id);
    } catch {
      /* ignore */
    }
    setChosen(id);
  };

  const handleSkip = () => {
    try {
      window.sessionStorage.removeItem("foodypop.intent");
    } catch {
      /* ignore */
    }
    setChosen("discover");
  };

  // Once chosen, navigate to the right place.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (chosen && !loading) {
    if (chosen === "vendor") {
      navigate({ to: "/vendors" });
      return null;
    }
    // All other intents land on home — the feed carries the relevant
    // filters; the intent is stored for future visits.
    navigate({ to: "/" });
    return null;
  }
  if (loading) return null;

  return (
    <div className="mx-auto grid max-w-2xl gap-10 px-4 py-12">
      <header className="grid gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          FoodyPop
        </p>
        <h1 className="text-4xl font-display leading-tight text-foreground">
          What are you looking for?
        </h1>
        <p className="text-muted-foreground">
          Tell us what you want and we'll show you the right dishes.
        </p>
      </header>

      <dl className="grid gap-4">
        {INTENTS.map((intent) => (
          <div
            key={intent.id}
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 transition hover:shadow-[var(--shadow-warm)]"
          >
            <dd className="grid gap-2">
              <div className="flex items-center gap-3">
                <dt className="text-xl font-semibold text-foreground">{intent.title}</dt>
              </div>
              <p className="text-sm text-muted-foreground">{intent.blurb}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{intent.description}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleChoose(intent.id)}
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
                    onClick={handleSkip}
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
          onClick={handleSkip}
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
