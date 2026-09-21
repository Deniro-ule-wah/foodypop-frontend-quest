import { DishCard } from "@/components/dish-card";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/state";
import type { Dish } from "@/lib/api/types";

/**
 * Shared dish listing block. Renders loading / error / empty / results.
 * Never substitutes placeholder dishes for missing backend data.
 */
export function DishGrid({
  dishes,
  isPending,
  error,
  onRetry,
  emptyTitle,
  emptyHint,
}: {
  dishes: Dish[] | undefined;
  isPending: boolean;
  error: unknown;
  onRetry?: () => void;
  emptyTitle: string;
  emptyHint: string;
}) {
  if (isPending) return <LoadingBlock label="Loading dishes" />;
  if (error) return <ErrorBlock error={error} {...(onRetry ? { onRetry } : {})} />;
  if (!dishes || dishes.length === 0) return <EmptyBlock title={emptyTitle} hint={emptyHint} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {dishes.map((dish) => (
        <DishCard key={dish.id} dish={dish} />
      ))}
    </div>
  );
}
