import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { playersLite } from "@/lib/queries";
import { toDateInputValue } from "@/lib/format";
import { TrainingForm } from "./TrainingForm";
import type { TrainingPlayerInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrainingRecordPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "COACH") redirect("/planificacion");

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: { trainingRecord: { include: { players: true } } },
  });
  if (!activity || activity.type !== "TRAINING") notFound();

  const players = await playersLite();
  const record = activity.trainingRecord;
  const initialPlayers: TrainingPlayerInput[] = (record?.players ?? []).map(
    (p) => ({
      playerId: p.playerId,
      attended: p.attended,
      justified: p.justified,
      absenceReason: p.absenceReason,
      grade: p.grade,
      observations: p.observations,
    }),
  );

  return (
    <div className="space-y-4">
      <Link
        href={`/planificacion/actividad/${activity.id}`}
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Actividad
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        {record ? "Editar registro" : "Registrar entrenamiento"}
      </h1>
      <TrainingForm
        activityId={activity.id}
        mode={record ? "edit" : "create"}
        recordId={record?.id}
        initialDate={toDateInputValue(record?.date ?? activity.date)}
        players={players}
        initialPlayers={initialPlayers}
      />
    </div>
  );
}
