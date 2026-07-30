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
    where: { status: "ACTIVE" },
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
  });
}

// Jugadores para formularios/convocatorias (forma ligera).
export async function playersLite() {
  return prisma.player.findMany({
    where: { status: "ACTIVE" },
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
  return prisma.player.count({ where: { status: "ACTIVE" } });
}

// Todos los jugadores (cualquier estado) para "Gestionar plantilla".
export async function managementPlayers() {
  return prisma.player.findMany({
    orderBy: [{ status: "asc" }, { firstName: "asc" }],
    include: {
      user: { select: { username: true } },
      _count: {
        select: {
          fines: true,
          attendance: true,
          trainingEntries: true,
          matchEntries: true,
          exerciseRatings: true,
          goals: true,
        },
      },
    },
  });
}

// Nº de fichas pendientes de revisión (aviso interno al entrenador).
export async function pendingCount() {
  return prisma.player.count({ where: { status: "PENDING" } });
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

// ─────────────────────────── Jugador del Mes ───────────────────────────

// ¿Cuenta esta votación para la clasificación? (cerrada o pasada su fecha, y no anulada)
function pollCounts(
  p: { status: string; closesAt: Date },
  now: Date,
): boolean {
  if (p.status === "CANCELLED") return false;
  return p.status === "CLOSED" || now >= p.closesAt;
}

// Votación del partido (o null).
export async function pollForActivity(activityId: string) {
  return prisma.poll.findUnique({
    where: { activityId },
    include: {
      candidates: { select: { id: true } },
      _count: { select: { ballots: true } },
    },
  });
}

export async function pollById(id: string) {
  return prisma.poll.findUnique({
    where: { id },
    include: {
      activity: true,
      candidates: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          number: true,
        },
      },
    },
  });
}

// Votación más reciente (por fecha del partido).
export async function latestPoll() {
  const poll = await prisma.poll.findFirst({
    orderBy: { activity: { date: "desc" } },
    include: {
      activity: true,
      candidates: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          number: true,
        },
      },
    },
  });
  return poll;
}

// Partidos (MATCH) que aún no tienen votación (para crearla).
export async function matchesWithoutPoll() {
  const acts = await prisma.activity.findMany({
    where: { type: "MATCH", poll: null },
    orderBy: { date: "desc" },
    include: { calledPlayers: { select: { id: true } } },
    take: 30,
  });
  return acts;
}

// Clasificación mensual (idempotente: se agrega en vivo desde las papeletas).
export async function monthlyClassification(monthKey: string) {
  const now = new Date();
  const polls = await prisma.poll.findMany({
    where: { monthKey, status: { not: "CANCELLED" } },
    include: { ballots: { where: { excluded: false } } },
  });
  const counted = polls.filter((p) => pollCounts(p, now));

  const pts = new Map<string, number>();
  const add = (id: string, n: number) => pts.set(id, (pts.get(id) ?? 0) + n);
  for (const p of counted)
    for (const b of p.ballots) {
      add(b.firstId, 3);
      add(b.secondId, 2);
      add(b.thirdId, 1);
    }

  const scoredIds = [...pts.keys()];
  const players = await prisma.player.findMany({
    where: {
      OR: [
        { status: "ACTIVE" },
        ...(scoredIds.length ? [{ id: { in: scoredIds } }] : []),
      ],
    },
    select: { id: true, firstName: true, lastName: true, photo: true },
  });

  return players
    .map((pl) => ({
      id: pl.id,
      name: `${pl.firstName} ${pl.lastName}`,
      photo: pl.photo,
      points: pts.get(pl.id) ?? 0,
    }))
    .sort(
      (a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"),
    );
}

// Historial de ganadores (meses con votaciones contabilizadas).
export async function winnersHistory() {
  const now = new Date();
  const polls = await prisma.poll.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { monthKey: true, status: true, closesAt: true },
  });
  const months = [
    ...new Set(polls.filter((p) => pollCounts(p, now)).map((p) => p.monthKey)),
  ]
    .sort()
    .reverse();

  const winners: {
    monthKey: string;
    id: string;
    name: string;
    photo: string | null;
    points: number;
  }[] = [];
  for (const mk of months) {
    const cls = await monthlyClassification(mk);
    const top = cls[0];
    if (top && top.points > 0) winners.push({ monthKey: mk, ...top });
  }
  return winners;
}

// Datos de administración de una votación (SIN exponer el contenido de los votos).
export async function pollAdminData(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      activity: true,
      ballots: { select: { id: true, voterId: true, excluded: true } },
      _count: { select: { ballots: true, candidates: true } },
    },
  });
  if (!poll) return null;

  const eligible = await prisma.player.findMany({
    where: { status: "ACTIVE", userId: { not: null } },
    select: { id: true, userId: true, firstName: true, lastName: true },
  });

  const nonExcludedVoterIds = new Set(
    poll.ballots.filter((b) => !b.excluded).map((b) => b.voterId),
  );
  const anyBallotByVoter = new Map(poll.ballots.map((b) => [b.voterId, b]));

  const voted = eligible
    .filter((p) => p.userId && anyBallotByVoter.has(p.userId))
    .map((p) => {
      const b = p.userId ? anyBallotByVoter.get(p.userId) : undefined;
      return {
        playerId: p.id,
        name: `${p.firstName} ${p.lastName}`,
        ballotId: b?.id ?? null,
        excluded: b?.excluded ?? false,
      };
    });
  const notVoted = eligible
    .filter((p) => !p.userId || !anyBallotByVoter.has(p.userId))
    .map((p) => ({ playerId: p.id, name: `${p.firstName} ${p.lastName}` }));

  return {
    poll,
    eligibleCount: eligible.length,
    votedCount: nonExcludedVoterIds.size,
    voted,
    notVoted,
  };
}
