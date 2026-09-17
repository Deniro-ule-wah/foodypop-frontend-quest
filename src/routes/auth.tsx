import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { login, register } from "@/lib/api/auth";
import { useSession } from "@/lib/session";
import { ErrorBlock, GapNotice } from "@/components/state";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FoodyPop" },
      {
        name: "description",
        content: "Sign in or create a FoodyPop account against the live V2 backend.",
      },
      { property: "og:title", content: "Sign in — FoodyPop" },
      { property: "og:description", content: "Authenticate against the FoodyPop V2 backend." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { signIn, token, user, signOut } = useSession();
  const navigate = useNavigate();

  const submit = useMutation({
    mutationFn: async () =>
      mode === "login" ? login({ email, password }) : register({ email, password, displayName }),
    onSuccess: (result) => {
      signIn(result.token, result.user);
      if (result.token) navigate({ to: "/" });
    },
  });

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl text-foreground">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          POST {mode === "login" ? "/auth/login" : "/auth/register"}
        </p>
      </header>

      {token ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-foreground">
            Signed in{user?.displayName ? ` as ${user.displayName}` : ""}. A bearer token is stored
            in this browser.
          </p>
          <button type="button" className="btn-secondary mt-3" onClick={signOut}>
            Sign out
          </button>
        </div>
      ) : null}

      <form
        className="grid gap-3 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!submit.isPending) submit.mutate();
        }}
      >
        {mode === "register" ? (
          <label className="grid gap-1 text-sm">
            Display name
            <input
              className="field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
        ) : null}
        <label className="grid gap-1 text-sm">
          Email
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={submit.isPending}>
          {submit.isPending
            ? "Contacting backend…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            submit.reset();
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
        </button>
      </form>

      {submit.isError ? <ErrorBlock error={submit.error} /> : null}
      {submit.isSuccess && !submit.data.token ? (
        <GapNotice title="No bearer token in the response">
          The backend accepted the request but returned no recognisable token field, so
          authenticated calls will still return 401. Backend dependency: a documented auth token
          response.
        </GapNotice>
      ) : null}

      <GapNotice title="Session behaviour">
        The backend exposes no <span className="font-mono">/auth/me</span> or{" "}
        <span className="font-mono">/auth/logout</span>. Identity comes from the sign-in response
        only, and signing out clears this browser's session without a server call.
      </GapNotice>
    </div>
  );
}
