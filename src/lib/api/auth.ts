import { apiRequest, tokenStore } from "./client";
import type { AuthUser } from "./types";

/**
 * VERIFIED endpoints: POST /auth/register, POST /auth/login, POST /auth/refresh.
 * NOT EXPOSED by the backend (confirmed 404): /auth/me, /auth/logout.
 * Logout is therefore a local session clear only — no endpoint is invented.
 */

export interface AuthResult {
  token: string | null;
  user: AuthUser | null;
  raw: unknown;
}

/** The token field name is read defensively; the client never assumes one shape. */
type Bag = Record<string, unknown>;

function nested(p: Bag, key: string): Bag | null {
  const v = p[key];
  return v && typeof v === "object" ? (v as Bag) : null;
}

export function extractToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Bag;
  const candidates: unknown[] = [
    p["accessToken"],
    p["token"],
    p["jwt"],
    p["access_token"],
    nested(p, "data")?.["accessToken"],
    nested(p, "data")?.["token"],
    nested(p, "tokens")?.["accessToken"],
    nested(p, "session")?.["accessToken"],
  ];
  const found = candidates.find((c) => typeof c === "string" && c.length > 0);
  return typeof found === "string" ? found : null;
}

export function extractUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Bag;
  return (p["user"] ?? nested(p, "data")?.["user"] ?? p["profile"] ?? null) as AuthUser | null;
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const raw = await apiRequest<unknown>("/auth/login", { method: "POST", body: input });
  const token = extractToken(raw);
  tokenStore.set(token);
  return { token, user: extractUser(raw), raw };
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResult> {
  const raw = await apiRequest<unknown>("/auth/register", { method: "POST", body: input });
  const token = extractToken(raw);
  tokenStore.set(token);
  return { token, user: extractUser(raw), raw };
}

/** Local-only: the backend exposes no logout endpoint. */
export function clearSession() {
  tokenStore.set(null);
}
