import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { playersLite } from "@/lib/queries";
import { dateToIsoWeek } from "@/lib/week";
import { toDateInputValue } from "@/lib/format";
import { PlanEditor } from "../PlanEditor";
import type { PlanActivityInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "COACH") redirect("/planificacion");

  const plan = await prisma.weeklyPlan.findUnique({
    where: { id: params.id },
    include: {
      activities: {
        orderBy: { date: "asc" },
        include: { calledPlayers: { select: { id: true } } },
      },
    },
  });
  if (!plan) notFound();

  const players = await playersLite();
  const initialActivities: PlanActivityInput[] = plan.activities.map((a) => ({
    id: a.id,
    type: a.type,
    date: toDateInputValue(a.date),
    startTime: a.startTime,
    endTime: a.endTime,
    place: a.place,
    opponent: a.opponent,
    matchday: a.matchday,
    callTime: a.callTime,
    kitLocal: a.kitLocal,
    calledPlayerIds: a.calledPlayers.map((p) => p.id),
  }));

  return (
    <div className="space-y-4">
      <Link
        href="/planificacion"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Planificación
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Editar planificación
      </h1>
      <PlanEditor
        mode="edit"
        planId={plan.id}
        players={players}
        initialWeek={dateToIsoWeek(plan.weekStart)}
        initialPublished={plan.published}
        initialActivities={initialActivities}
      />
    </div>
  );
}
