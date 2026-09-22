import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchDishes } from "@/lib/api/dishes";
import { DishGrid } from "@/components/dish-grid";
import { EmptyBlock } from "@/components/state";
import { seo } from "@/lib/seo";

/**
 * Search results are intentionally NOT indexable: an open query parameter
 * would otherwise create unlimited thin URLs. The page stays fully usable.
 */
export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search["q"] === "string" ? search["q"].slice(0, 100) : "";
    return q ? { q } : {};
  },
  head: () => {
    const { meta } = seo({
      title: "Search dishes and drinks — FoodyPop",
      description: "Search FoodyPop for a dish or drink by name.",
      path: "/search",
      noindex: true,
    });
    return { meta };
  },
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const term = q ?? "";
  const [input, setInput] = useState(term);

  const results = useQuery({
    queryKey: ["dishes", "search", term],
    queryFn: ({ signal }) => searchDishes({ q: term, limit: 24 }, signal),
    enabled: term.length > 0,
    retry: false,
  });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across every dish and drink published on FoodyPop.
        </p>
      </header>

      <form
        role="search"
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const next = input.trim();
          navigate({ to: "/search", search: next ? { q: next } : {} });
        }}
      >
        <label htmlFor="q" className="sr-only">
          Search dishes
        </label>
        <input
          id="q"
          name="q"
          type="search"
          className="field max-w-md"
          placeholder="pilau, samosa, dawa cocktail…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={input.trim().length === 0}>
          Search
        </button>
      </form>

      {term.length === 0 ? (
        <EmptyBlock
          title="Enter a search term"
          hint="Nothing is searched until you type a dish or drink name."
        />
      ) : (
        <>
          <h2 className="text-xl text-foreground">Results for “{term}”</h2>
          <DishGrid
            dishes={results.data?.items}
            isPending={results.isPending}
            error={results.isError ? results.error : null}
            onRetry={() => results.refetch()}
            emptyTitle={`No dishes matched “${term}”`}
            emptyHint="FoodyPop returned no results for this search."
          />
        </>
      )}
    </div>
  );
}
