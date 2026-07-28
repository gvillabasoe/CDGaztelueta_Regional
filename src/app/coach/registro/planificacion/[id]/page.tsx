import { redirect } from "next/navigation";
import { PlanEditor } from "@/app/coach/registro/PlanEditor";
import { getPlanForEdit, getPlayersLite } from "@/lib/planning";
import type { PlayerLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarPlanificacionPage({
  params,
}: {
  params: { id: string };
}) {
  const [plan, players] = await Promise.all([
    getPlanForEdit(params.id),
    getPlayersLite(),
  ]);
  if (!plan) redirect("/coach/registro");
  return (
    <div className="space-y-4">
      <p className="eyebrow">Editar planificación semanal</p>
      <PlanEditor
        players={players as PlayerLite[]}
        initial={plan}
        planId={plan.id}
      />
    </div>
  );
}
