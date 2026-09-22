import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { breadcrumbList, jsonLd, seo } from "@/lib/seo";

const TITLE = "Terms of use — FoodyPop web hub";
const DESCRIPTION =
  "The basic terms that apply when browsing dishes and placing orders through the FoodyPop web hub.";
const PATH = "/terms";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Terms", path: PATH },
];

export const Route = createFileRoute("/terms")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return { meta, links, scripts: [jsonLd(breadcrumbList(CRUMBS))] };
  },
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <Breadcrumbs crumbs={CRUMBS} />
      <h1 className="text-4xl text-foreground">Terms of use</h1>
      <p className="text-muted-foreground">
        These notes describe how the web hub behaves. They are not a substitute for FoodyPop&apos;s
        full legal terms, which are not published on this site.
      </p>
      <h2 className="text-2xl text-foreground">Listings</h2>
      <p className="text-muted-foreground">
        Dish names, descriptions, prices and availability come from the vendors who publish them.
        This site displays them as received and does not add, adjust or estimate any of them.
      </p>
      <h2 className="text-2xl text-foreground">Orders</h2>
      <p className="text-muted-foreground">
        An order exists only once FoodyPop has accepted it. The stage shown on an order page is the
        stage FoodyPop reports; this site never marks an order as paid or completed on its own.
      </p>
      <h2 className="text-2xl text-foreground">Accounts</h2>
      <p className="text-muted-foreground">
        You are responsible for keeping your sign-in details safe. Signing out on this device clears
        your session from it.
      </p>
    </div>
  );
}
