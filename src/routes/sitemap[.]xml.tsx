import { createFileRoute } from "@tanstack/react-router";
import { getDishFeed } from "@/lib/api/dishes";
import { listCategories, listCuisines } from "@/lib/api/vendors";
import { dishDisplayName } from "@/lib/cart";
import { entitySlug } from "@/lib/slug";
import { taxonomyId, taxonomyName } from "@/lib/taxonomy";
import { canonicalUrl } from "@/lib/seo";

/**
 * /sitemap.xml — canonical public URLs only.
 *
 * Static hub pages are always present. Dish / cuisine / category URLs are
 * generated from live FoodyPop data; if a lookup fails, those entries are
 * omitted rather than fabricated. Private areas (auth, cart, orders,
 * diagnostics) and search results are never listed.
 */

const STATIC_PATHS = [
  "/",
  "/food",
  "/drinks",
  "/dishes",
  "/cuisines",
  "/categories",
  "/vendors",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error("[sitemap] source unavailable:", (error as Error).message);
    return null;
  }
}

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = new Set(STATIC_PATHS);

        const feed = await safe(() => getDishFeed({ limit: 200 }));
        for (const dish of feed?.items ?? []) {
          if (dish?.id) paths.add(`/dish/${entitySlug(dish.id, dishDisplayName(dish))}`);
        }

        const cuisines = await safe(() => listCuisines());
        for (const c of cuisines ?? []) {
          paths.add(`/cuisine/${entitySlug(taxonomyId(c), taxonomyName(c))}`);
        }

        const categories = await safe(() => listCategories());
        for (const c of categories ?? []) {
          paths.add(`/category/${entitySlug(taxonomyId(c), taxonomyName(c))}`);
        }

        const urls = [...paths]
          .map((p) => `  <url><loc>${xmlEscape(canonicalUrl(p))}</loc></url>`)
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=600",
          },
        });
      },
    },
  },
});
