import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

const NAV = [
  { to: "/dishes", label: "Dishes" },
  { to: "/food", label: "Food" },
  { to: "/drinks", label: "Drinks" },
  { to: "/cuisines", label: "Cuisines" },
  { to: "/categories", label: "Categories" },
  { to: "/vendors", label: "Vendors" },
  { to: "/search", label: "Search" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { token, user, signOut } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <BrandLogo size="md" />

        <nav
          aria-label="Primary"
          className="ml-4 hidden flex-wrap items-center gap-1 lg:flex lg:gap-2"
        >
          {NAV.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-[#F5A623] font-medium"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/orders"
            className={[
              "hidden text-sm sm:inline-flex rounded-full px-3 py-1.5 transition-colors",
              location.pathname.startsWith("/orders")
                ? "bg-primary/10 text-[#F5A623] font-medium"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
            ].join(" ")}
            aria-current={location.pathname.startsWith("/orders") ? "page" : undefined}
          >
            Orders
          </Link>
          <Link
            to="/cart"
            className={[
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              count > 0
                ? "bg-primary/10 text-[#F5A623] font-medium"
                : "bg-muted text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
            ].join(" ")}
            aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
          >
            <span className="flex items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="text-current"
              >
                <path
                  d="M6 2L3 7v10l3 5 9-9-3-5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12c0 4.5-3.5 8-8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {count > 0 ? <span className="text-xs">{count}</span> : ""}
              <span className="hidden sm:inline">Cart</span>
            </span>
          </Link>
          {token ? (
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
              onClick={() => {
                signOut();
                navigate({ to: "/auth" });
              }}
            >
              {user?.displayName ? `Hi, ${user.displayName}` : "Sign out"}
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-[#F5A623] px-3 py-1.5 text-sm text-white font-medium transition-colors hover:bg-[#E0961F] hover:text-white"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            className="btn-ghost text-sm lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          aria-label="Mobile"
          className="grid gap-1 border-t border-border/50 bg-background/90 px-4 py-3 lg:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={[
                "block rounded-full px-3 py-2 text-sm transition-colors",
                location.pathname.startsWith(item.to)
                  ? "bg-primary/10 text-[#F5A623] font-medium"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/orders"
            onClick={() => setOpen(false)}
            className="block rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
          >
            Orders
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
