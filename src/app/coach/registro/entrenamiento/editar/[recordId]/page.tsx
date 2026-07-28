import { redirect } from "next/navigation";
import { TrainingForm } from "@/app/coach/registro/TrainingForm";
import { getTrainingRecordForEdit, getPlayersLite } from "@/lib/planning";
import type { PlayerLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarEntrenamientoPage({
  params,
}: {
  params: { recordId: string };
}) {
  const [record, players] = await Promise.all([
    getTrainingRecordForEdit(params.recordId),
    getPlayersLite(),
  ]);
  if (!record) redirect("/coach/registro");

  return (
    <div className="space-y-4">
      <p className="eyebrow">Editar entrenamiento</p>
      <TrainingForm
        players={players as PlayerLite[]}
        today={record.date}
        mode="edit"
        recordId={params.recordId}
        initial={record}
      />
    </div>
  );
}
