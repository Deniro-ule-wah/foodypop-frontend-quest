import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { breadcrumbList, jsonLd, seo } from "@/lib/seo";

const TITLE = "Privacy — FoodyPop web hub";
const DESCRIPTION =
  "What the FoodyPop web hub stores in your browser, what it sends to FoodyPop, and what it never handles.";
const PATH = "/privacy";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Privacy", path: PATH },
];

export const Route = createFileRoute("/privacy")({
  head: () => {
    const { meta, links } = seo({ title: TITLE, description: DESCRIPTION, path: PATH });
    return { meta, links, scripts: [jsonLd(breadcrumbList(CRUMBS))] };
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <Breadcrumbs crumbs={CRUMBS} />
      <h1 className="text-4xl text-foreground">Privacy</h1>
      <p className="text-muted-foreground">
        This page describes only what the FoodyPop web hub itself does in your browser. It is not a
        legal privacy policy for the wider FoodyPop service.
      </p>
      <h2 className="text-2xl text-foreground">Stored in your browser</h2>
      <ul className="grid gap-2 text-muted-foreground">
        <li>Your sign-in session, so you stay signed in between visits.</li>
        <li>Your basket, which stays on this device until you place an order.</li>
      </ul>
      <h2 className="text-2xl text-foreground">Sent to FoodyPop</h2>
      <p className="text-muted-foreground">
        Sign-in details, searches you run, dishes you follow and orders you place are sent to
        FoodyPop so they can be handled. Nothing else is transmitted from this site.
      </p>
      <h2 className="text-2xl text-foreground">Never handled here</h2>
      <p className="text-muted-foreground">
        The web hub never holds payment credentials, and no account, basket or order information is
        made public or shared with search engines.
      </p>
    </div>
  );
}
