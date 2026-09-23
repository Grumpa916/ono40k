import { useEffect, useState, useSyncExternalStore } from "react";
import { getSupabase, readSupabaseConfig, subscribeSupabaseConfig } from "@/lib/supabase";

type SessionState = { pending: boolean; userId: string | null; email: string | null };

function sameSession(a: SessionState, b: SessionState) {
  return a.pending === b.pending && a.userId === b.userId && a.email === b.email;
}

export function useSupabaseConfig() {
  return useSyncExternalStore(subscribeSupabaseConfig, readSupabaseConfig, () => null);
}

export function useSupabaseSession() {
  const config = useSupabaseConfig();
  const configKey = config ? `${config.url}\n${config.anonKey}` : "";
  const [state, setState] = useState<SessionState>({ pending: true, userId: null, email: null });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState((current) => (sameSession(current, { pending: false, userId: null, email: null }) ? current : { pending: false, userId: null, email: null }));
      return;
    }
    let cancel = false;
    const apply = (next: SessionState) => {
      if (cancel) return;
      setState((current) => (sameSession(current, next) ? current : next));
    };
    void supabase.auth.getSession().then(({ data }) => {
      apply({
        pending: false,
        userId: data.session?.user.id ?? null,
        email: data.session?.user.email ?? null,
      });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      apply({
        pending: false,
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
      });
    });
    return () => {
      cancel = true;
      data.subscription.unsubscribe();
    };
  }, [configKey]);

  return state;
}
