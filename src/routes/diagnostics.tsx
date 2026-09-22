import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL, apiRequest } from "@/lib/api/client";
import { CONTRACT, CONTRACT_GAPS, LEGACY_BACKEND } from "@/lib/contract";
import { ErrorBlock, LoadingBlock } from "@/components/state";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "API diagnostics — FoodyPop" },
      {
        name: "description",
        content:
          "Backend target, live health check, verified endpoint contract and documented gaps.",
      },
      { property: "og:title", content: "API diagnostics — FoodyPop" },
      {
        property: "og:description",
        content: "What this FoodyPop client is allowed to call, with evidence.",
      },
    ],
  }),
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => apiRequest<unknown>("/health", { signal }),
    retry: false,
  });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl text-foreground">API diagnostics</h1>
        <p className="text-sm text-muted-foreground">
          Every backend route this client is permitted to call, with the evidence it was verified
          against.
        </p>
      </header>

      <section className="grid gap-2 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-foreground">
          Active backend: <span className="font-mono">{API_BASE_URL}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Legacy host <span className="font-mono">{LEGACY_BACKEND}</span> is not used by this
          client.
        </p>
        <div className="mt-2">
          {health.isPending ? (
            <LoadingBlock label="Checking /health" />
          ) : health.isError ? (
            <ErrorBlock error={health.error} onRetry={() => health.refetch()} />
          ) : (
            <pre className="overflow-x-auto rounded-xl bg-muted p-3 font-mono text-xs text-muted-foreground">
              {JSON.stringify(health.data, null, 2)}
            </pre>
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl text-foreground">Verified endpoint contract</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Path</th>
                <th className="px-4 py-2">Auth</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACT.map((entry) => (
                <tr key={`${entry.method} ${entry.path}`} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">{entry.method}</td>
                  <td className="px-4 py-2 font-mono text-xs">{entry.path}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {entry.auth ? "required" : "public"}
                  </td>
                  <td className="px-4 py-2 text-xs font-semibold">{entry.status}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{entry.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl text-foreground">Documented gaps (not implemented, not faked)</h2>
        <ul className="grid gap-3">
          {CONTRACT_GAPS.map((gap) => (
            <li key={gap.capability} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium text-foreground">{gap.capability}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {gap.probed.join(" · ")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{gap.result}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
