import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import { BrandLogo } from "./brand-logo";

const NAV = [
  { to: "/dishes", label: "Dishes" },
  { to: "/food", label: "Food" },
  { to: "/drinks", label: "Drinks" },
  { to: "/cuisines", label: "Cuisines" },
  { to: "/categories", label: "Categories" },
  { to: "/vendors", label: "Vendors" },
  { to: "/search", label: "Search" },
] as const;

function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  // From the supplied FoodyPop V2 logo asset:
  // Wordmark: FOODYPOP in bold rounded sans-serif, uppercase
  // Colors: mustard yellow (F,O,O,D) / taupe (Y) / medium blue (P,O,P)
  // The icon is a rounded square with a white F/P monogram over a yellow→blue diagonal gradient.
  // We render the wordmark inline to keep it crisp at every size and avoid
  // loading a raster asset for the logo.

  const scale = size === "sm" ? 0.85 : size === "lg" ? 1.15 : 1;
  const textScale = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";
  const iconSize = size === "sm" ? 22 : size === "lg" ? 34 : 28;

  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 font-display font-semibold tracking-tight text-foreground no-underline transition-colors hover:text-foreground"
      aria-label="FoodyPop home"
    >
      {/* Standalone icon mark — rounded square with diagonal gradient + white F/P glyph */}
      <span
        aria-hidden="true"
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-blue-500"
        style={{ width: iconSize, height: iconSize, flexShrink: 0 }}
      >
        {/* White monogram glyph approximating the F/P mark from the logo */}
        <svg
          width={size === "sm" ? 14 : size === "lg" ? 22 : 18}
          height={size === "sm" ? 14 : size === "lg" ? 22 : 18}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 6h3l3 4 3-4h3v9h-3v-5l-3 4-3-4h-3v-4h3m3 4h3v4h-3v-4m-6 0h3v4h-3v-4m0 4h4v4h-4v-4"
            fill="currentColor"
            className="text-white"
          />
        </svg>
      </span>

      {/* Wordmark: FOODYPOP — mustard/taupe/blue per the supplied asset */}
      <span
        className={textScale}
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <span className="text-[#F5A623]">F</span>
        <span className="text-[#F5A623]">O</span>
        <span className="text-[#F5A623]">O</span>
        <span className="text-[#F5A623]">D</span>
        <span className="text-[#C9B896]">Y</span>
        <span className="text-[#4F86C1]">P</span>
        <span className="text-[#4F86C1]">O</span>
        <span className="text-[#4F86C1]">P</span>
      </span>
    </Link>
  );
}

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
