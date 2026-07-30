import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { playersLite } from "@/lib/queries";
import { toDateInputValue } from "@/lib/format";
import { MatchForm } from "./MatchForm";

export const dynamic = "force-dynamic";

export default async function MatchRecordPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "COACH") redirect("/planificacion");

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: {
      matchRecord: {
        include: {
          players: true,
          goals: true,
          substitutions: true,
          cards: true,
        },
      },
    },
  });
  if (!activity || activity.type !== "MATCH") notFound();

  const players = await playersLite();
  const r = activity.matchRecord;

  return (
    <div className="space-y-4">
      <Link
        href={`/planificacion/actividad/${activity.id}`}
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Actividad
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        {r ? "Editar registro" : "Registrar partido"}
      </h1>
      <MatchForm
        activityId={activity.id}
        mode={r ? "edit" : "create"}
        recordId={r?.id}
        initialDate={toDateInputValue(r?.date ?? activity.date)}
        initialOpponent={r?.opponent ?? activity.opponent ?? ""}
        players={players}
        initialPlayers={(r?.players ?? []).map((p) => ({
          playerId: p.playerId,
          isStarter: p.isStarter,
          position: p.position,
          grade: p.grade,
          observations: p.observations,
        }))}
        initialGoals={(r?.goals ?? []).map((g) => ({
          playerId: g.playerId,
          minute: g.minute,
        }))}
        initialSubs={(r?.substitutions ?? []).map((s) => ({
          playerOutId: s.playerOutId,
          playerInId: s.playerInId,
          minute: s.minute,
        }))}
        initialCards={(r?.cards ?? []).map((c) => ({
          playerId: c.playerId,
          type: c.type,
        }))}
        initialFormation={r?.formation ?? ""}
        initialTeamGoals={r?.teamGoals ?? 0}
        initialOpponentGoals={r?.opponentGoals ?? 0}
        initialGlobalGrade={r?.globalGrade ?? null}
        initialGeneralObs={r?.generalObservations ?? ""}
      />
    </div>
  );
}
