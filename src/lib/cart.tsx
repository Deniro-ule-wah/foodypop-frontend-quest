import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Dish } from "./api/types";

/**
 * LOCAL CART STATE ONLY.
 * This never represents a persisted backend order. An order exists only after
 * POST /orders returns a backend-created record.
 */

export interface CartLine {
  dishId: string;
  name: string;
  unitPrice: number | null;
  currency: string | null;
  vendorId: string | null;
  quantity: number;
}

const CART_KEY = "foodypop.cart.local";

interface CartValue {
  lines: CartLine[];
  add: (dish: Dish) => void;
  setQuantity: (dishId: string, quantity: number) => void;
  remove: (dishId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number | null;
}

const CartContext = createContext<CartValue | null>(null);

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function dishDisplayName(dish: Dish): string {
  return (dish.name as string) || (dish.title as string) || `Dish ${dish.id}`;
}

export function dishEffectivePrice(dish: Dish): number | null {
  return toNumber(dish.discountPrice) ?? toNumber(dish.price);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const add = useCallback((dish: Dish) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.dishId === dish.id);
      if (existing) {
        return prev.map((l) => (l.dishId === dish.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          name: dishDisplayName(dish),
          unitPrice: dishEffectivePrice(dish),
          currency: (dish.currency as string) ?? null,
          vendorId: (dish.vendorId as string) ?? (dish.vendor?.id ?? null),
          quantity: 1,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((dishId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.dishId !== dishId)
        : prev.map((l) => (l.dishId === dishId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((dishId: string) => {
    setLines((prev) => prev.filter((l) => l.dishId !== dishId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const priced = lines.filter((l) => l.unitPrice !== null);
    const subtotal =
      priced.length === lines.length && lines.length > 0
        ? lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.quantity, 0)
        : null;
    return { lines, add, setQuantity, remove, clear, count, subtotal };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
