/**
 * Centralized FoodyPop V2 API client.
 * ALL backend communication goes through this module.
 *
 * Authoritative backend: https://foodypop-backend.onrender.com
 * The legacy host foodypop-api.onrender.com is intentionally NOT referenced.
 */

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/+$/, "") ||
  "https://foodypop-backend.onrender.com";

const TOKEN_KEY = "foodypop.auth.token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    if (typeof window === "undefined") return;
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export type ApiErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "validation"
  | "server"
  | "unknown";

/** Normalized error for every failed backend interaction. Never swallowed. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string | null;
  readonly requestId: string | null;
  readonly details: unknown;
  readonly path: string;

  constructor(init: {
    kind: ApiErrorKind;
    status: number;
    code?: string | null;
    message: string;
    requestId?: string | null;
    details?: unknown;
    path: string;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code ?? null;
    this.requestId = init.requestId ?? null;
    this.details = init.details;
    this.path = init.path;
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
  signal?: AbortSignal | undefined;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(API_BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = false, signal } = options;
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (auth) {
    const token = tokenStore.get();
    if (token) headers["authorization"] = `Bearer ${token}`;
  }

  const url = buildUrl(path, query);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    if ((cause as Error)?.name === "AbortError") throw cause;
    throw new ApiError({
      kind: "network",
      status: 0,
      message: "Network unavailable — the FoodyPop backend could not be reached.",
      path,
    });
  }

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const envelope = (payload as { error?: Record<string, unknown> } | null)?.error;
    throw new ApiError({
      kind: kindFromStatus(res.status),
      status: res.status,
      code: (envelope?.["code"] as string) ?? null,
      message:
        (envelope?.["message"] as string) ||
        (typeof payload === "string" && payload) ||
        `Request failed with status ${res.status}`,
      requestId: (envelope?.["requestId"] as string) ?? null,
      details: envelope?.["details"] ?? null,
      path,
    });
  }

  return payload as T;
}

/** Paginated cursor envelope returned by /dishes/feed, /dishes/search, /vendors. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
