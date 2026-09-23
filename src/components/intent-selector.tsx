import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

export const INTENT_OPTIONS = [
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

export function IntentSelector({
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">FoodyPop</p>
      </div>
      <h1 className="mt-2 text-center text-3xl font-display leading-tight text-foreground sm:text-4xl">
        What are you looking for?
      </h1>
      <p className="mt-2 text-center max-w-lg text-muted-foreground">
        Tell us what you want and we'll show you the right dishes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTENT_OPTIONS.map((intent) => (
          <div
            key={intent.id}
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 transition hover:shadow-[var(--shadow-warm)]"
          >
            <div className="grid gap-2">
              <h2 className="text-xl font-semibold text-foreground">{intent.title}</h2>
              <p className="text-sm text-muted-foreground">{intent.blurb}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{intent.description}</p>
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={() => onChoose(intent.id)}>
                  {intent.title}
                </button>
                {intent.id === "vendor" ? (
                  <Link to="/vendors" className="btn-ghost">
                    Go to vendors
                  </Link>
                ) : (
                  <button type="button" className="btn-ghost" onClick={onSkip}>
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        <button type="button" className="underline hover:text-foreground" onClick={onSkip}>
          Skip — show me everything
        </button>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Your choice is remembered for this browser session.
      </p>
    </div>
  );
}
