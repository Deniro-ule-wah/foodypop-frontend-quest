import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy dish URL. The canonical dish page is /dish/{slug}; this route exists
 * only so previously shared /dishes/{id} links keep working.
 */
export const Route = createFileRoute("/dishes/$dishId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/dish/$slug", params: { slug: params.dishId }, replace: true });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: () => null,
});
