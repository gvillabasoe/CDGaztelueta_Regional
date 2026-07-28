import { redirect } from "next/navigation";
import { TrainingForm } from "@/app/coach/registro/TrainingForm";
import { getPlannedTrainingForRegistro, getPlayersLite } from "@/lib/planning";
import type { PlayerLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NuevoEntrenamientoPage({
  params,
}: {
  params: { plannedId: string };
}) {
  const [planned, players] = await Promise.all([
    getPlannedTrainingForRegistro(params.plannedId),
    getPlayersLite(),
  ]);
  if (!planned || planned.hasRecord) redirect("/coach/registro");

  return (
    <div className="space-y-4">
      <p className="eyebrow">Registrar entrenamiento</p>
      <TrainingForm
        players={players as PlayerLite[]}
        today={planned.defaultDate}
        mode="create"
        plannedTrainingId={planned.id}
        contextLabel={`${planned.dayLabel} · ${planned.weekLabel}`}
      />
    </div>
  );
}
