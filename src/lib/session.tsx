import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStore } from "./api/client";
import { clearSession } from "./api/auth";
import type { AuthUser } from "./api/types";

const USER_KEY = "foodypop.auth.user";

interface SessionValue {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  signIn: (token: string | null, user: AuthUser | null) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(tokenStore.get());
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = useCallback((nextToken: string | null, nextUser: AuthUser | null) => {
    tokenStore.set(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    try {
      if (nextUser) window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      else window.localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ token, user, ready, signIn, signOut }),
    [token, user, ready, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
