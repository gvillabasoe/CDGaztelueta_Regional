import Link from "next/link";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/session";
import { weeklyPlans, playerCount } from "@/lib/queries";
import { formatDateShort } from "@/lib/format";
import { PlanList } from "./PlanList";

export const dynamic = "force-dynamic";

const weekday = (d: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    timeZone: "Europe/Madrid",
  }).format(d);

export default async function PlanificacionPage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";
  const total = await playerCount();
  const plans = await weeklyPlans(!isCoach);

  const lite = plans.map((p) => {
    const end = new Date(p.weekStart);
    end.setDate(end.getDate() + 6);
    return {
      id: p.id,
      published: p.published,
      weekLabel: `Semana ${formatDateShort(p.weekStart)} – ${formatDateShort(end)}`,
      activities: p.activities.map((a) => {
        const notGoing = a.attendance.filter(
          (x) => x.status === "NOT_GOING",
        ).length;
        return {
          id: a.id,
          type: a.type,
          dayName: weekday(a.date),
          dateShort: formatDateShort(a.date),
          startTime: a.startTime,
          endTime: a.endTime,
          place: a.place,
          opponent: a.opponent,
          matchday: a.matchday,
          callTime: a.callTime,
          kitLocal: a.kitLocal,
          exerciseCount: a._count.exercises,
          calledCount: a.calledPlayers.length,
          goingCount: total - notGoing,
          notGoingCount: notGoing,
          hasRecord: !!(a.trainingRecord || a.matchRecord),
        };
      }),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-negro">
            Planificación
          </h1>
          <p className="text-sm text-gris">
            Entrenamientos, partidos y registros por semana.
          </p>
        </div>
        {isCoach && (
          <Link href="/planificacion/nueva" className="btn-gold shrink-0">
            <Plus size={16} /> Crear
          </Link>
        )}
      </div>
      <PlanList isCoach={isCoach} plans={lite} />
    </div>
  );
}
