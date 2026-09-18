/**
 * Central SEO utilities. Every public page builds its metadata here so
 * title / description / canonical / Open Graph / Twitter logic exists once.
 *
 * TRUTH RULE: nothing in this module fabricates content. Callers pass real
 * values derived from the FoodyPop V2 backend, or omit them.
 */

export const SITE_URL = "https://foodypop-frontend-quest.lovable.app";
export const SITE_NAME = "FoodyPop";

export function canonicalUrl(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  // Normalise trailing slash (root stays "/").
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : "/";
  return `${SITE_URL}${clean === "/" ? "" : clean}` || SITE_URL;
}

export interface SeoInput {
  title: string;
  description: string;
  /** Path of THIS page — canonical and og:url always self-reference. */
  path: string;
  /** Absolute https image URL only. Omit when there is no real image. */
  image?: string | null;
  type?: "website" | "article" | "product";
  noindex?: boolean;
}

type MetaTag = Record<string, string>;

export function seo(input: SeoInput): { meta: MetaTag[]; links: Array<Record<string, string>> } {
  const url = canonicalUrl(input.path);
  const meta: MetaTag[] = [
    { title: input.title },
    { name: "description", content: input.description },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: input.image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
  ];

  if (input.image && /^https:\/\//.test(input.image)) {
    meta.push({ property: "og:image", content: input.image });
    meta.push({ name: "twitter:image", content: input.image });
  }

  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  // Private / noindex pages get no canonical — they are not search entities.
  const links = input.noindex ? [] : [{ rel: "canonical", href: url }];
  return { meta, links };
}

/** Head script entry for JSON-LD. Only call with data backed by page content. */
export function jsonLd(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: canonicalUrl(c.path),
    })),
  };
}

export function collectionPage(input: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: canonicalUrl(input.path),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}
