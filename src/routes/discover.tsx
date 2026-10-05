import { createFileRoute, Link } from "@tanstack/react-router";
import { DishPopEngine } from "@/components/dish-pop-engine";
import { seo } from "@/lib/seo";
import type { Intent } from "@/lib/recommend";

const TITLE = "Dish POP — one dish at a time | FoodyPop";
const DESCRIPTION =
  "Tell FoodyPop if you want to discover, you're hungry or thirsty, and get served one dish at a time. Check the taste, the vendor, or skip to the next.";

export const Route = createFileRoute("/discover")({
  validateSearch: (s: Record<string, unknown>): { intent?: Intent } =>
    s["intent"] === "discover" || s["intent"] === "hungry" || s["intent"] === "thirsty"
      ? { intent: s["intent"] }
      : {},
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: "/discover" });
    return { meta, links };
  },
  component: DiscoverPage,
});

function DiscoverPage() {
  const { intent } = Route.useSearch();
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-3xl text-foreground sm:text-4xl">What are you looking for?</h1>
        <p className="text-sm text-muted-foreground">
          One dish at a time. Prefer a list?{" "}
          <Link to="/food" className="underline">Browse all food</Link>
        </p>
      </header>
      <DishPopEngine {...(intent ? { initialIntent: intent } : {})} />
      <p className="text-xs text-muted-foreground">
        Next dishes are picked in your browser from simple rules (your intent, taste picks, price and variety) plus some
        surprise. This is a stand-in until FoodyPop's own recommendations are available.
      </p>
    </div>
  );
}
