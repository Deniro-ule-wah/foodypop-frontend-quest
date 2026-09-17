import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

const NAV = [
  { to: "/", label: "Discover" },
  { to: "/search", label: "Search" },
  { to: "/vendors", label: "Vendors" },
  { to: "/orders", label: "Orders" },
  { to: "/diagnostics", label: "Diagnostics" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { token, user, signOut } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="font-display text-xl tracking-tight text-foreground">
          Foody<span className="text-primary">Pop</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "rounded-full px-3 py-1.5 text-sm bg-muted text-foreground font-medium",
              }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/cart" className="btn-secondary text-sm">
            Cart{count > 0 ? ` · ${count}` : ""}
          </Link>
          {token ? (
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => {
                signOut();
                navigate({ to: "/auth" });
              }}
            >
              Sign out{user?.displayName ? ` (${user.displayName})` : ""}
            </button>
          ) : (
            <Link to="/auth" className="btn-primary text-sm">
              Sign in
            </Link>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            className="btn-ghost text-sm md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <nav className="grid gap-1 border-t border-border px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
