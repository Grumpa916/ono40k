import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Crosshair, Flag, List, ScrollText, Swords } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { AccountSync, retrySave, useSaveDetail, useSavePhase } from "@/components/account-sync";
import { Toaster } from "@/components/ui/sonner";
import { getSupabase } from "@/lib/supabase";
import { useSupabaseConfig, useSupabaseSession } from "@/lib/use-supabase-session";
import { useWarStore, hydrateWarStore } from "@/lib/store";
import { useCodexSync } from "@/lib/codex-sync";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Lists", icon: List, match: (p: string) => p === "/" || p.startsWith("/lists") },
  { to: "/setup", label: "Setup", icon: Flag, match: (p: string) => p.startsWith("/setup") },
  { to: "/battle", label: "Ledger", icon: Swords, match: (p: string) => p.startsWith("/battle") },
  { to: "/analytics", label: "Annals", icon: ScrollText, match: (p: string) => p.startsWith("/analytics") },
  { to: "/codex", label: "Codex", icon: BookOpen, match: (p: string) => p.startsWith("/codex") },
  { to: "/lab", label: "Lab", icon: Crosshair, match: (p: string) => p.startsWith("/lab") },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const wide = pathname.startsWith("/battle") || pathname.startsWith("/setup");
  const activeGameId = useWarStore((s) => s.activeGameId);
  useCodexSync((s) => s.revision);

  useEffect(() => {
    void hydrateWarStore();
  }, []);

  return (
    <div className="tactical-grid min-h-dvh">
      <AccountSync />
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className={cn("mx-auto flex h-14 items-center justify-between gap-3 px-4", wide ? "max-w-[90rem]" : "max-w-6xl")}>
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-lg font-semibold tracking-wide">Ono40k</span>
            <span className="hidden text-[10px] tracking-[0.2em] text-muted-foreground uppercase sm:inline">11th edition</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
                      active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                    {item.to === "/battle" && activeGameId ? (
                      <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-blood" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <AccountSlot />
          </div>
        </div>
      </header>
      <SaveBanner />
      <main className={cn("mx-auto w-full min-w-0 px-4 pt-5 pb-24 md:pb-10", wide ? "max-w-[90rem]" : "max-w-6xl")}>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium tracking-wide uppercase",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
                {item.to === "/battle" && activeGameId ? (
                  <span className="absolute top-2 right-[calc(50%-18px)] size-1.5 rounded-full bg-blood" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
      <Toaster />
    </div>
  );
}

function saveHint(message: string) {
  const text = message.toLowerCase();
  if (text.includes("account_saves") || text.includes("schema cache") || text.includes("does not exist") || text.includes("permission denied") || text.includes("row-level security")) {
    return "Supabase sign-in worked, but the save table is missing or blocked. In Supabase open SQL Editor, run the SQL from the Account page, then tap Retry.";
  }
  return message || "Could not save to Supabase.";
}

function SaveBanner() {
  const phase = useSavePhase();
  const message = useSaveDetail();
  if (phase !== "error") return null;
  return (
    <div className="border-b border-blood/40 bg-blood/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <p className="text-sm text-foreground">{saveHint(message)}</p>
        <button type="button" className="text-sm font-medium underline-offset-4 hover:underline" onClick={() => retrySave()}>
          Retry
        </button>
      </div>
    </div>
  );
}

function AccountSlot() {
  const config = useSupabaseConfig();
  const supabaseSession = useSupabaseSession();
  const phase = useSavePhase();
  const mark = phase === "saving" ? "Saving" : phase === "saved" ? "Saved" : phase === "error" ? "Not saved" : null;

  if (config && supabaseSession.userId && !supabaseSession.pending) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        {mark ? <span className="hidden text-[10px] tracking-wide text-muted-foreground uppercase sm:inline">{mark}</span> : null}
        <span className="hidden max-w-[7rem] truncate text-sm sm:inline">{supabaseSession.email}</span>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center rounded-md border border-border px-3 text-sm text-foreground"
          onClick={() => {
            void getSupabase()?.auth.signOut();
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/login"
      className="inline-flex h-10 shrink-0 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium text-foreground"
    >
      Account
    </Link>
  );
}
