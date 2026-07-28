import { redirect } from "next/navigation";
import { MatchForm } from "@/app/coach/registro/MatchForm";
import { planExists, getPlayersLite } from "@/lib/planning";
import { toDateInputValue } from "@/lib/format";
import type { PlayerLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NuevoPartidoPage() {
  if (!(await planExists())) redirect("/coach/registro");
  const players = await getPlayersLite();
  return (
    <div className="space-y-4">
      <p className="eyebrow">Registrar partido</p>
      <MatchForm
        players={players as PlayerLite[]}
        today={toDateInputValue(new Date())}
        mode="create"
      />
    </div>
  );
}
