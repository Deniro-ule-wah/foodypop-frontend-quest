import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { breadcrumbList, jsonLd, seo } from "@/lib/seo";

const TITLE = "About FoodyPop";
const DESCRIPTION =
  "FoodyPop is a dish-first food discovery platform: find a dish you want, then find the vendor who makes it. Learn what the FoodyPop web hub does.";
const PATH = "/about";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "About", path: PATH },
];

export const Route = createFileRoute("/about")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return { meta, links, scripts: [jsonLd(breadcrumbList(CRUMBS))] };
  },
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <Breadcrumbs crumbs={CRUMBS} />
      <h1 className="text-4xl text-foreground">About FoodyPop</h1>
      <p className="text-muted-foreground">
        FoodyPop is dish first and people second. You start from the food — a plate, a drink, a
        cuisine — and the vendor who makes it comes with it, rather than the other way round.
      </p>
      <h2 className="text-2xl text-foreground">What this web hub does</h2>
      <ul className="grid gap-2 text-muted-foreground">
        <li>Browse the dish feed, and food and drinks hubs.</li>
        <li>Explore cuisines and categories published on FoodyPop.</li>
        <li>Open a dish page for its details, price and vendor.</li>
        <li>Build a basket and place an order with a FoodyPop account.</li>
      </ul>
      <h2 className="text-2xl text-foreground">What is not here yet</h2>
      <p className="text-muted-foreground">
        Vendor creation from the web hub is not yet built. Where a feature is missing, the page says
        so instead of pretending it worked.
      </p>
      <p className="text-sm text-muted-foreground">
        Start browsing:{" "}
        <Link to="/dishes" className="underline">
          dishes
        </Link>
        {" · "}
        <Link to="/food" className="underline">
          food
        </Link>
        {" · "}
        <Link to="/drinks" className="underline">
          drinks
        </Link>
        {" · "}
        <Link to="/contact" className="underline">
          contact
        </Link>
      </p>
    </div>
  );
}
