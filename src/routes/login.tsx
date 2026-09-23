import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPABASE_SCHEMA, clearSupabaseConfig, getSupabase, saveSupabaseConfig, useBuiltinSupabase } from "@/lib/supabase";
import { useSupabaseConfig, useSupabaseSession } from "@/lib/use-supabase-session";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [ready, setReady] = useState(false);
  const config = useSupabaseConfig();
  const session = useSupabaseSession();

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || (config && session.pending)) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!config) return <ConnectProject />;
  if (session.userId) {
    return (
      <main className="mx-auto w-full max-w-sm space-y-4 py-6">
        <h1 className="font-display text-2xl font-semibold">Signed in</h1>
        <p className="text-sm text-muted-foreground">{session.email} is connected. Lists save to Supabase from this browser.</p>
        <Button asChild className="w-full">
          <Link to="/">Back to lists</Link>
        </Button>
      </main>
    );
  }
  return <SupabaseSignIn />;
}

function ConnectProject() {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  return (
    <form
      className="mx-auto w-full max-w-sm space-y-3 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        try {
          saveSupabaseConfig(url, anonKey);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save that project.");
        }
      }}
    >
      <div>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Supabase</p>
        <h1 className="font-display mt-1 text-2xl font-semibold">Connect a project</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste the project URL and the publishable key. Do not paste the secret key.
        </p>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Project URL</span>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://xxxx.supabase.co"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="url"
          required
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Publishable key</span>
        <Input
          value={anonKey}
          onChange={(event) => setAnonKey(event.target.value)}
          placeholder="sb_publishable_…"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
      </label>
      {error ? <p className="text-sm text-blood">{error}</p> : null}
      <Button type="submit" className="w-full">
        Connect
      </Button>
      <button type="button" className="text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={() => useBuiltinSupabase()}>
        Use the built-in project
      </button>
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">SQL to run once in Supabase</summary>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-3 text-[11px] leading-relaxed text-foreground">{SUPABASE_SCHEMA}</pre>
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full"
          onClick={() => {
            void navigator.clipboard.writeText(SUPABASE_SCHEMA).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy SQL"}
        </Button>
      </details>
    </form>
  );
}

function SupabaseSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(mode: "in" | "up") {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setNotice("");
    const credentials = { email: email.trim(), password };
    const result = mode === "in" ? await supabase.auth.signInWithPassword(credentials) : await supabase.auth.signUp(credentials);
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (mode === "up" && !result.data.session) {
      setNotice("Check your email to confirm the account, then sign in.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm space-y-4 py-6">
      <div>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Supabase</p>
        <h1 className="font-display mt-1 text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use the same email and password on every device.</p>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Email</span>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Password</span>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={6}
          required
        />
      </label>
      {error ? <p className="text-sm text-blood">{error}</p> : null}
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      <Button type="button" className="w-full" disabled={busy} onClick={() => void submit("in")}>
        Sign in
      </Button>
      <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void submit("up")}>
        Create account
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => {
          void getSupabase()?.auth.signOut();
          clearSupabaseConfig();
        }}
      >
        Use a different project
      </button>
    </main>
  );
}
