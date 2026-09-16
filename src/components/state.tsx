import { ApiError } from "@/lib/api/client";
import type { ReactNode } from "react";

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid gap-3" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">{label}…</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function GapNotice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/60 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function describe(error: unknown): { heading: string; body: string; meta: string | null; details: string | null } {
  if (error instanceof ApiError) {
    const headings: Record<string, string> = {
      network: "Network unavailable",
      unauthorized: "Sign in required",
      forbidden: "Not permitted",
      not_found: "Not found",
      rate_limited: "Too many requests",
      validation: "The backend rejected this request",
      server: "Backend unavailable",
      unknown: "Request failed",
    };
    return {
      heading: headings[error.kind] ?? "Request failed",
      body: error.message,
      meta: `${error.status || "—"} ${error.code ?? ""} ${error.path}${error.requestId ? ` · requestId ${error.requestId}` : ""}`,
      details: error.details ? JSON.stringify(error.details, null, 2) : null,
    };
  }
  return {
    heading: "Unexpected error",
    body: error instanceof Error ? error.message : String(error),
    meta: null,
    details: null,
  };
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { heading, body, meta, details } = describe(error);
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
      <p className="font-semibold text-destructive">{heading}</p>
      <p className="mt-1 text-sm text-foreground">{body}</p>
      {meta ? <p className="mt-2 font-mono text-xs text-muted-foreground">{meta}</p> : null}
      {details ? (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-card p-3 font-mono text-xs text-muted-foreground">
          {details}
        </pre>
      ) : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Retry
        </button>
      ) : null}
    </div>
  );
}
