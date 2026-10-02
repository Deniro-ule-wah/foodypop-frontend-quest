import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef } from "react";
import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDish } from "@/lib/api/dishes";
import { dishDisplayName } from "@/lib/cart";
import { entitySlug } from "@/lib/slug";
import { DishPopViewport } from "@/components/dish-pop";
import { ErrorBlock, LoadingBlock } from "@/components/state";
import type { Dish } from "@/lib/api/types";

/** Dishes the user clicked, so the POP opens instantly with the exact record. */
const clicked = new Map<string, Dish>();
let openedInSession = false;

/**
 * Opens the POP for the exact clicked dish. Adds `?pop=<id>` to the current
 * discovery URL (keeps filters, component state and scroll) and masks the
 * address bar as the canonical /dish/<slug> URL. Browser back closes it.
 */
export function useOpenDishPop() {
  const navigate = useNavigate();
  return (dish: Dish) => {
    clicked.set(dish.id, dish);
    openedInSession = true;
    void navigate({
      to: ".",
      search: ((prev: Record<string, unknown>) => ({ ...prev, pop: dish.id })) as never,
      resetScroll: false,
      mask: { to: "/dish/$slug", params: { slug: entitySlug(dish.id, dishDisplayName(dish)) } } as never,
    });
  };
}

export function DishPopDialog() {
  const router = useRouter();
  const navigate = useNavigate();
  const popId = useRouterState({
    select: (s) => {
      const v = (s.location.search as Record<string, unknown>)["pop"];
      return typeof v === "string" ? v : null;
    },
  });
  const returnFocus = useRef<Element | null>(null);
  if (popId && typeof document !== "undefined" && !returnFocus.current) returnFocus.current = document.activeElement;

  const known = popId ? clicked.get(popId) : undefined;
  const query = useQuery({
    queryKey: ["dish", popId],
    queryFn: ({ signal }) => getDish(popId!, signal),
    enabled: !!popId && !known,
    retry: false,
  });
  const dish = known ?? query.data;

  const close = () => {
    if (openedInSession) {
      openedInSession = false;
      router.history.back();
    } else {
      void navigate({
        to: ".",
        search: ((prev: Record<string, unknown>) => {
          const { pop: _pop, ...rest } = prev;
          return rest;
        }) as never,
        resetScroll: false,
        replace: true,
      });
    }
  };

  return (
    <DialogPrimitive.Root open={!!popId} onOpenChange={(o) => (!o ? close() : null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            const el = returnFocus.current as HTMLElement | null;
            returnFocus.current = null;
            if (el?.isConnected) {
              e.preventDefault();
              el.focus({ preventScroll: true });
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-background focus:outline-none sm:inset-x-4 sm:inset-y-6 sm:mx-auto sm:max-w-5xl sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none"
        >
          <div className="sticky top-0 z-10 flex justify-end bg-gradient-to-b from-background to-transparent p-3">
            <DialogPrimitive.Close
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground shadow hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close dish"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="-mt-8 px-4 pb-8 sm:px-8">
            {dish ? (
              <DishPopViewport
                key={dish.id}
                initialDish={dish}
                showDishNav={false}
                renderTitle={(name) => (
                  <DialogPrimitive.Title className="font-display text-3xl leading-tight text-foreground">
                    {name}
                  </DialogPrimitive.Title>
                )}
              />
            ) : (
              <>
                <DialogPrimitive.Title className="sr-only">Dish</DialogPrimitive.Title>
                {query.error ? <ErrorBlock error={query.error} onRetry={() => void query.refetch()} /> : <LoadingBlock label="Loading dish" />}
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
