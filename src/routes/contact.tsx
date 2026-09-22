import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { breadcrumbList, jsonLd, seo } from "@/lib/seo";

const TITLE = "Contact FoodyPop";
const DESCRIPTION =
  "How to reach FoodyPop about a dish listing, a vendor account or an order placed through the FoodyPop web hub.";
const PATH = "/contact";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Contact", path: PATH },
];

export const Route = createFileRoute("/contact")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return { meta, links, scripts: [jsonLd(breadcrumbList(CRUMBS))] };
  },
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <Breadcrumbs crumbs={CRUMBS} />
      <h1 className="text-4xl text-foreground">Contact</h1>
      <p className="text-muted-foreground">
        No public contact address, phone number or support form has been provided for the web hub
        yet, so none is shown here — an invented address would only send people nowhere.
      </p>
      <h2 className="text-2xl text-foreground">If you need help now</h2>
      <ul className="grid gap-2 text-muted-foreground">
        <li>
          Order questions: open the order from{" "}
          <Link to="/orders" className="underline">
            your orders
          </Link>{" "}
          while signed in — it shows the current stage of the order.
        </li>
        <li>
          Something not loading: the{" "}
          <Link to="/diagnostics" className="underline">
            service status page
          </Link>{" "}
          shows whether FoodyPop is reachable right now.
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">
        Send us the contact details you want published and they will appear on this page.
      </p>
    </div>
  );
}
