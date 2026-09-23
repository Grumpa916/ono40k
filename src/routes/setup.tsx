import { createFileRoute } from "@tanstack/react-router";
import { GameSetup } from "@/components/battle/game-setup";
import { useWarStore } from "@/lib/store";

type Search = { list?: string };

export const Route = createFileRoute("/setup")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    list: typeof s.list === "string" ? s.list : undefined,
  }),
  component: SetupPage,
});

function SetupPage() {
  const { list } = Route.useSearch();
  const known = useWarStore((s) => (list ? s.lists.some((l) => l.id === list) : false));
  const mine = list && known ? ({ kind: "list", listId: list } as const) : null;
  return <GameSetup key={mine?.listId ?? "open"} initialMine={mine} initialTheirs={null} />;
}
