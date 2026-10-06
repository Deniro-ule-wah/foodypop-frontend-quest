import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getDishFeed, createGesture, TASTES } from "@/lib/api/dishes";
import { dishDisplayName, dishEffectivePrice, useCart } from "@/lib/cart";
import { dishCategory } from "@/lib/taxonomy";
import { entitySlug } from "@/lib/slug";
import { useSession } from "@/lib/session";
import { DishMedia, DishIdentity } from "@/components/dish-media";
import { ErrorBlock, LoadingBlock } from "@/components/state";
import { demoReviews, demoTags, demoTaste, demoVendor, isDemoDish } from "@/lib/demo/catalog";
import { classifySwipe } from "@/lib/swipe";
import { emptySignals, markSeen, recordTaste, serveNextDish, shouldSendTaste, type DishType, type Intent, type Signals } from "@/lib/recommend";
import type { Dish } from "@/lib/api/types";

type Panel = "dish" | "details" | "vendor" | "taste";

/** Session-only discovery state (in memory; survives in-app navigation, not reloads). */
const session: { signals: Signals; currentId: string | null; intent: Intent; type: DishType; picked: Record<string, string[]> } = {
  signals: emptySignals(),
  currentId: null,
  intent: "discover",
  type: "all",
  picked: {},
};

const INTENTS: Array<{ id: Intent; label: string; hint: string }> = [
  { id: "discover", label: "Discover", hint: "Something new" },
  { id: "hungry", label: "Hungry", hint: "Filling & good value" },
  { id: "thirsty", label: "Thirsty", hint: "Drinks" },
];

const box = "grid gap-2 rounded-2xl border border-border bg-card p-4";
const label = "text-xs uppercase tracking-wide text-muted-foreground";

export function DishPopEngine({ initialIntent }: { initialIntent?: Intent }) {
  const feed = useQuery({
    queryKey: ["dishes", "feed", "hub"],
    queryFn: ({ signal }) => getDishFeed({ limit: 48 }, signal),
    retry: false,
  });
  const all = feed.data?.items ?? [];
  const [intent, setIntentState] = useState<Intent>(initialIntent ?? session.intent);
  const [type, setTypeState] = useState<DishType>(session.type);
  const [current, setCurrent] = useState<Dish | null>(null);
  const [panel, setPanel] = useState<Panel>("dish");
  const [, force] = useState(0);
  const shownAt = useRef(Date.now());
  const { token } = useSession();
  const { add } = useCart();

  const serve = useCallback(
    (opts?: { intent?: Intent; type?: DishType; skip?: boolean }) => {
      const i = opts?.intent ?? intent;
      const t = opts?.type ?? type;
      const s = session.signals;
      // Skip signal: leaving a dish within 2s nudges its category down.
      if (opts?.skip && current && Date.now() - shownAt.current < 2000) {
        const c = dishCategory(current)?.name ?? "";
        s.categories[c] = (s.categories[c] ?? 0) - 0.5;
      }
      const next = serveNextDish(all, { intent: i, type: t, signals: s, currentId: current?.id });
      if (next) {
        markSeen(s, next.id);
        session.currentId = next.id;
      }
      shownAt.current = Date.now();
      setCurrent(next);
      setPanel("dish");
    },
    [all, intent, type, current],
  );

  // First dish (or restore the dish from earlier in this session).
  useEffect(() => {
    if (!all.length || current) return;
    const restored = session.currentId ? all.find((d) => d.id === session.currentId) : null;
    if (restored && !initialIntent) setCurrent(restored);
    else serve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length]);

  const setIntent = (i: Intent) => {
    session.intent = i;
    setIntentState(i);
    serve({ intent: i });
  };
  const setType = (t: DishType) => {
    session.type = t;
    setTypeState(t);
    serve({ type: t });
  };

  const openPanel = (p: Panel) => {
    setPanel((cur) => (cur === p ? "dish" : p));
    if (current && (p === "details" || p === "vendor")) {
      const c = dishCategory(current)?.name ?? "";
      session.signals.categories[c] = (session.signals.categories[c] ?? 0) + 0.3;
    }
  };

  // Keyboard: ↓ next, ← details, → vendor, ↑ taste, Esc back to dish.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      const map: Record<string, () => void> = {
        ArrowDown: () => serve({ skip: true }),
        ArrowLeft: () => openPanel("details"),
        ArrowRight: () => openPanel("vendor"),
        ArrowUp: () => openPanel("taste"),
        Escape: () => setPanel("dish"),
      };
      const fn = map[e.key];
      if (fn && current) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Swipe on the dish surface: up = next, left = details, right = vendor.
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastSwipe = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    // Multi-finger (pinch) gestures are never treated as swipes.
    touch.current = t && e.touches.length === 1 ? { x: t.clientX, y: t.clientY, t: Date.now() } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    const t = e.changedTouches[0];
    touch.current = null;
    if (!s || !t) return;
    const now = Date.now();
    if (now - lastSwipe.current < 350) return; // one action per gesture
    const action = classifySwipe(t.clientX - s.x, t.clientY - s.y, now - s.t);
    if (!action) return;
    lastSwipe.current = now;
    if (action === "next") serve({ skip: true });
    else openPanel(action);
  };

  const demo = isDemoDish(current);
  const gesture = useMutation({
    mutationFn: (t: string) => {
      if (!current || isDemoDish(current)) return Promise.reject(new Error("Unavailable"));
      return createGesture(current.id, t);
    },
  });

  const pickTaste = (t: string) => {
    if (!current) return;
    const picked = session.picked[current.id] ?? [];
    const on = !picked.includes(t);
    session.picked[current.id] = on ? [...picked, t] : picked.filter((x) => x !== t);
    recordTaste(session.signals, t, on);
    if (shouldSendTaste(demo, !!token, on)) gesture.mutate(t);
    force((n) => n + 1);
  };

  const header = (
    <div className="grid gap-3">
      <div role="group" aria-label="What are you looking for?" className="flex flex-wrap gap-2">
        {INTENTS.map((i) => (
          <button key={i.id} type="button" aria-pressed={intent === i.id} onClick={() => setIntent(i.id)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${intent === i.id ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary/40"}`}>
            <span className="font-medium">{i.label}</span>
            <span className="ml-1.5 hidden text-xs opacity-80 sm:inline">· {i.hint}</span>
          </button>
        ))}
      </div>
      {intent === "discover" ? (
        <div role="group" aria-label="Food or drink" className="flex gap-1 rounded-full border border-border p-1 w-fit text-xs font-medium">
          {(["all", "food", "drink"] as DishType[]).map((t) => (
            <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}
              className={`rounded-full px-3 py-1 uppercase tracking-wide ${type === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "Both" : t}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (feed.isPending) return <div className="grid gap-4">{header}<LoadingBlock label="Finding a dish for you" /></div>;
  if (feed.isError) return <div className="grid gap-4">{header}<ErrorBlock error={feed.error} onRetry={() => void feed.refetch()} /></div>;

  if (!current) {
    return (
      <div className="grid gap-4">
        {header}
        <div className={box}>
          <p className="font-medium text-foreground">
            {intent === "thirsty" || type === "drink" ? "No drinks are published yet." : "No dishes match right now."}
          </p>
          <p className="text-sm text-muted-foreground">Nothing is invented in their place. Try another option:</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => { setTypeState("all"); session.type = "all"; setIntent("discover"); }}>
              Discover any dish
            </button>
          </div>
        </div>
      </div>
    );
  }

  const name = dishDisplayName(current);
  const price = dishEffectivePrice(current);
  const original = typeof current.price === "number" ? current.price : null;
  const vendorId = current.vendor?.id || current.vendorId || null;
  const vendorName = current.vendor?.name || current.vendor?.displayName || null;
  const vInfo = vendorId ? demoVendor(vendorId) : null;
  const picked = session.picked[current.id] ?? [];
  const reviews = demo ? demoReviews(current) : [];
  const learned = Object.entries(session.signals.tastes).filter(([, w]) => w > 0).map(([t]) => t);

  const controls: Array<{ p: Panel | "next"; label: string; key: string }> = [
    { p: "details", label: "Details", key: "←" },
    { p: "taste", label: "Taste", key: "↑" },
    { p: "vendor", label: "Vendor", key: "→" },
    { p: "next", label: "Next dish", key: "↓" },
  ];

  return (
    <section aria-label="Dish POP discovery" className="grid gap-4">
      {header}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="grid gap-3">
          <div className="relative touch-none select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => (touch.current = null)}>
            <div key={current.id} className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 motion-reduce:animate-none">
              <DishMedia dish={current} />
            </div>
            {demo ? (
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Demo · browse only
              </span>
            ) : null}
          </div>
          <div aria-live="polite" className="grid gap-1">
            <h2 className="font-display text-3xl leading-tight text-foreground">{name}</h2>
            <DishIdentity dish={current} />
            <p className="text-xl font-semibold text-primary">
              {price !== null ? `${(current.currency as string) || "KES"} ${price.toLocaleString()}` : "Price not published yet"}
              {original !== null && price !== null && price < original ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground line-through">KES {original.toLocaleString()}</span>
              ) : null}
              {demo && price !== null ? <span className="ml-2 text-xs font-normal text-muted-foreground">illustrative</span> : null}
            </p>
            {demoTaste(current).length ? (
              <p className="text-sm text-foreground/80">{demoTaste(current).join(" · ")} <span className="text-xs text-muted-foreground">(demo labels)</span></p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 lg:sticky lg:top-4">
          <div className="grid grid-cols-4 gap-2" role="toolbar" aria-label="Dish actions">
            {controls.map((c) => {
              const active = c.p === panel;
              return (
                <button key={c.p} type="button" aria-pressed={c.p === "next" ? undefined : active}
                  aria-keyshortcuts={{ "←": "ArrowLeft", "↑": "ArrowUp", "→": "ArrowRight", "↓": "ArrowDown" }[c.key]}
                  onClick={() => (c.p === "next" ? serve({ skip: true }) : openPanel(c.p))}
                  className={`grid min-h-14 place-items-center rounded-2xl px-1 py-2 text-sm font-medium transition-colors ${
                    c.p === "next" ? "bg-primary text-primary-foreground hover:opacity-90" : active ? "bg-foreground text-background" : "border border-border bg-card hover:bg-secondary/40"
                  }`}>
                  <span aria-hidden="true" className="text-base leading-none">{c.key}</span>
                  <span className="text-xs sm:text-sm">{c.label}</span>
                </button>
              );
            })}
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">Tip: use the arrow keys. On a phone, swipe the photo up for the next dish, left for details, right for the vendor.</p>

          {panel === "dish" ? (
            <div className={box}>
              <p className="text-sm text-foreground">{String(current.description ?? "")}</p>
              {learned.length ? <p className="text-xs text-muted-foreground">Picking dishes with: {learned.join(", ")} (from your taste picks this session)</p> : null}
            </div>
          ) : null}

          {panel === "details" ? (
            <div className={box}>
              <p className={label}>About this dish</p>
              {current.description ? <p className="text-sm text-foreground">{String(current.description)}</p> : null}
              {Array.isArray(current["ingredients"]) ? <p className="text-sm text-muted-foreground">Ingredients: {(current["ingredients"] as string[]).join(", ")}</p> : null}
              {demoTags(current).length ? (
                <div className="flex flex-wrap gap-1.5">{demoTags(current).map((t) => <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">#{t}</span>)}</div>
              ) : null}
              <p className={`${label} mt-2`}>{demo ? "Sample reviews · Demo content" : "Reviews"}</p>
              {reviews.length ? reviews.map((r) => (
                <blockquote key={r.text} className="text-sm text-foreground">“{r.text}” <span className="text-muted-foreground">— {r.stars}★ sample</span></blockquote>
              )) : <p className="text-sm text-muted-foreground">No reviews yet.</p>}
              <Link to="/dish/$slug" params={{ slug: entitySlug(current.id, name) }} className="w-fit text-sm underline">Open full dish page</Link>
            </div>
          ) : null}

          {panel === "vendor" ? (
            <div className={box}>
              <p className={label}>Made by{vInfo ? " · demo vendor" : ""}</p>
              {vendorName ? <p className="font-medium text-foreground">{vendorName}</p> : <p className="text-sm text-muted-foreground">Vendor not published.</p>}
              {vInfo ? (
                <>
                  <p className="text-sm italic text-muted-foreground">{vInfo.tagline}</p>
                  <p className="text-sm text-muted-foreground">{vInfo.location as string} · {vInfo.hours}</p>
                  <p className="text-sm text-muted-foreground">{vInfo.fulfillment.join(" · ")} — sample details, not verified</p>
                </>
              ) : null}
              {vendorId ? <Link to="/vendors/$vendorId" params={{ vendorId }} className="w-fit text-sm underline">View vendor</Link> : null}
            </div>
          ) : null}

          {panel === "taste" ? (
            <div className={box}>
              <p className={label}>How does this sound to you?</p>
              <div className="flex flex-wrap gap-2">
                {TASTES.map((t) => {
                  const on = picked.includes(t);
                  return (
                    <button key={t} type="button" aria-pressed={on} onClick={() => pickTaste(t)} disabled={gesture.isPending}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${on ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary/40"}`}>
                      {on ? `✓ ${t}` : t}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {demo
                  ? "Demo dish: your picks only steer the next dishes in this session — nothing is sent to FoodyPop."
                  : token
                    ? "Your pick is saved to FoodyPop and steers the next dishes."
                    : "Your picks steer the next dishes in this session. Sign in to save them to FoodyPop."}
              </p>
              {gesture.isError ? <p className="text-xs text-destructive">Couldn't save your reaction. It still counts for this session.</p> : null}
            </div>
          ) : null}

          {demo ? (
            <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">Browse-only demo dish — ordering and following open once a real vendor publishes it.</p>
          ) : price !== null ? (
            <button type="button" className="btn-primary w-fit" onClick={() => add(current)}>Add to cart</button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
