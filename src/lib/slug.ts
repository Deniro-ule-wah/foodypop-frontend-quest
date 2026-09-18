/**
 * Slug helpers.
 *
 * The backend exposes identifiers, not slugs. To keep dish / cuisine /
 * category URLs readable AND canonically unique we build a composite slug:
 *
 *   {readable-name}--{backend-id}
 *
 * The id after the final "--" is authoritative; the readable part is cosmetic.
 * No slug is ever invented for an entity the backend did not return.
 */

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function entitySlug(id: string, name?: string | null): string {
  const readable = name ? slugify(name) : "";
  return readable ? `${readable}--${id}` : id;
}

/** Extracts the backend id from a composite slug. */
export function idFromSlug(slug: string): string {
  const marker = slug.lastIndexOf("--");
  return marker === -1 ? slug : slug.slice(marker + 2);
}
