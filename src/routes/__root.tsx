import { BrandLogo } from "@/components/brand-logo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SessionProvider } from "../lib/session";
import { CartProvider } from "../lib/cart";
import { SiteHeader } from "../components/site-header";
import { API_BASE_URL } from "../lib/api/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-secondary">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FoodyPop — discover food and drinks worth trying" },
      {
        name: "description",
        content:
          "FoodyPop is dish-first food discovery: browse dishes, drinks, cuisines and categories from local vendors.",
      },
      { property: "og:site_name", content: "FoodyPop" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 text-sm sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">FoodyPop</p>
        </div>
        <nav aria-label="Discover">
          <h2 className="font-display text-base text-foreground">Discover</h2>
          <ul className="mt-2 grid gap-1 text-muted-foreground">
            <li>
              <Link to="/dishes" className="hover:underline">
                All dishes
              </Link>
            </li>
            <li>
              <Link to="/food" className="hover:underline">
                Food
              </Link>
            </li>
            <li>
              <Link to="/drinks" className="hover:underline">
                Drinks
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Browse">
          <h2 className="font-display text-base text-foreground">Browse</h2>
          <ul className="mt-2 grid gap-1 text-muted-foreground">
            <li>
              <Link to="/cuisines" className="hover:underline">
                Cuisines
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:underline">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/vendors" className="hover:underline">
                Vendors
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="FoodyPop">
          <h2 className="font-display text-base text-foreground">FoodyPop</h2>
          <ul className="mt-2 grid gap-1 text-muted-foreground">
            <li>
              <Link to="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:underline">
                Terms
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-6 max-w-6xl text-xs text-muted-foreground">
        FoodyPop · service status:{" "}
        <Link to="/diagnostics" className="underline">
          diagnostics
        </Link>{" "}
        · <span className="font-mono">{API_BASE_URL}</span>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
              {/* Required: nested routes render here. */}
              <Outlet />
            </main>
            <Footer />
          </div>
        </CartProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
