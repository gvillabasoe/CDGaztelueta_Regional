import { PlanEditor } from "@/app/coach/registro/PlanEditor";
import { getPlayersLite } from "@/lib/planning";
import type { PlayerLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NuevaPlanificacionPage() {
  const players = await getPlayersLite();
  return (
    <div className="space-y-4">
      <p className="eyebrow">Nueva planificación semanal</p>
      <PlanEditor players={players as PlayerLite[]} />
    </div>
  );
}
