import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchDishes } from "@/lib/api/dishes";
import { DishCard } from "@/components/dish-card";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search dishes — FoodyPop" },
      { name: "description", content: "Search FoodyPop dishes and drinks through the live backend search endpoint." },
      { property: "og:title", content: "Search dishes — FoodyPop" },
      { property: "og:description", content: "Search food and drinks against the FoodyPop V2 backend." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");

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
          Queries go to the backend search endpoint. There is no client-side substitute index.
        </p>
      </header>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(input.trim());
        }}
      >
        <label htmlFor="q" className="sr-only">
          Search dishes
        </label>
        <input
          id="q"
          className="field max-w-md"
          placeholder="pilau, samosa, dawa cocktail…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={input.trim().length === 0}>
          Search
        </button>
        <span className="self-center font-mono text-xs text-muted-foreground">GET /dishes/search</span>
      </form>

      {term.length === 0 ? (
        <EmptyBlock title="Enter a search term" hint="Nothing is requested from the backend until you search." />
      ) : results.isPending ? (
        <LoadingBlock label="Searching" />
      ) : results.isError ? (
        <ErrorBlock error={results.error} onRetry={() => results.refetch()} />
      ) : results.data.items.length === 0 ? (
        <EmptyBlock title={`No dishes matched “${term}”`} hint="The backend returned an empty result set." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.data.items.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
