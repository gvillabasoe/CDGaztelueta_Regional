import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Jugador asociado al usuario de la sesión (o null si es entrenador).
export async function currentPlayer() {
  const s = await getSession();
  if (!s) return null;
  return prisma.player.findFirst({ where: { userId: s.userId } });
}

// Plantilla completa.
export async function roster() {
  return prisma.player.findMany({
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
  });
}

// Jugadores para formularios/convocatorias (forma ligera).
export async function playersLite() {
  return prisma.player.findMany({
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      number: true,
      positions: true,
    },
  });
}

// Semanas de planificación con sus actividades ordenadas cronológicamente.
export async function weeklyPlans(onlyPublished: boolean) {
  const plans = await prisma.weeklyPlan.findMany({
    where: onlyPublished ? { published: true } : {},
    orderBy: { weekStart: "desc" },
    include: {
      activities: {
        include: {
          _count: { select: { exercises: true } },
          calledPlayers: { select: { id: true } },
          attendance: true,
          trainingRecord: { select: { id: true } },
          matchRecord: { select: { id: true } },
        },
      },
    },
  });
  // Orden cronológico de actividades dentro de cada semana.
  for (const p of plans) {
    p.activities.sort((a, b) => {
      const da = a.date.getTime() - b.date.getTime();
      if (da !== 0) return da;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
  }
  return plans;
}

// Detalle completo de una actividad.
export async function getActivity(id: string) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      plan: true,
      exercises: { orderBy: { orderIndex: "asc" } },
      calledPlayers: { select: { id: true } },
      attendance: true,
      trainingRecord: { select: { id: true } },
      matchRecord: { select: { id: true } },
    },
  });
}

// Total de jugadores (para el resumen de asistencia: GOING = total - NOT_GOING).
export async function playerCount() {
  return prisma.player.count();
}

// Último entrenamiento (actividad TRAINING publicada más reciente ya pasada;
// si todas son futuras, la más próxima). Para la valoración del jugador (8.8).
export async function lastTraining() {
  const all = await prisma.activity.findMany({
    where: { type: "TRAINING", plan: { published: true } },
    include: { exercises: { orderBy: { orderIndex: "asc" } } },
  });
  if (all.length === 0) return null;
  const now = Date.now();
  const past = all
    .filter((a) => a.date.getTime() <= now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const upcoming = [...all].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  return past[0] ?? upcoming[0];
}

export async function playerRatings(playerId: string, exerciseIds: string[]) {
  if (exerciseIds.length === 0) return {} as Record<string, number>;
  const rows = await prisma.exerciseRating.findMany({
    where: { playerId, exerciseId: { in: exerciseIds } },
  });
  const map: Record<string, number> = {};
  for (const r of rows) map[r.exerciseId] = r.rating;
  return map;
}

// Multas de un mes concreto (year, month 0-11).
export async function finesForMonth(year: number, month: number) {
  const from = new Date(year, month, 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return prisma.fine.findMany({
    where: { date: { gte: from, lt: to } },
    include: {
      player: {
        select: { id: true, firstName: true, lastName: true, number: true },
      },
    },
    orderBy: { date: "asc" },
  });
}

// Total de multas de toda la plantilla (toda la temporada).
export async function finesGrandTotal() {
  const agg = await prisma.fine.aggregate({ _sum: { amount: true } });
  return agg._sum.amount ?? 0;
}
