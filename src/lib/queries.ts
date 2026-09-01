import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { DocKind } from "@/lib/types";

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
      staffUser: {
        select: { id: true, username: true, displayName: true },
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
  const polls = await prisma.poll.findMany({
    where: { monthKey, status: { not: "CANCELLED" } },
    include: { ballots: { where: { excluded: false } } },
  });

  // Se cuentan TODAS las votaciones no anuladas (abiertas = provisional, cerradas = definitivo).
  const pts = new Map<string, number>();
  const add = (id: string, n: number) => pts.set(id, (pts.get(id) ?? 0) + n);
  for (const p of polls)
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

// Votantes elegibles: jugadores activos con cuenta + cuerpo técnico con permiso de voto.
export async function eligibleVoters() {
  const players = await prisma.player.findMany({
    where: { status: "ACTIVE", userId: { not: null } },
    select: { id: true, userId: true, firstName: true, lastName: true },
  });
  const staff = await prisma.user.findMany({
    where: { role: "COACH", canVote: true },
    select: { id: true, username: true },
  });
  return [
    ...players.map((p) => ({
      voterId: p.userId as string,
      name: `${p.firstName} ${p.lastName}`,
      kind: "player" as const,
    })),
    ...staff.map((u) => ({
      voterId: u.id,
      name: `Entrenador (${u.username})`,
      kind: "coach" as const,
    })),
  ];
}

// Datos de administración de una votación (SIN exponer el contenido de los votos).
export async function pollAdminData(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      activity: true,
      ballots: {
        select: { id: true, voterId: true, excluded: true, onBehalfOfId: true },
      },
      _count: { select: { ballots: true, candidates: true } },
    },
  });
  if (!poll) return null;

  const voters = await eligibleVoters();
  const nonExcluded = new Set(
    poll.ballots.filter((b) => !b.excluded).map((b) => b.voterId),
  );
  const byVoter = new Map(poll.ballots.map((b) => [b.voterId, b]));

  const voted = voters
    .filter((v) => byVoter.has(v.voterId))
    .map((v) => {
      const b = byVoter.get(v.voterId)!;
      return {
        voterId: v.voterId,
        name: v.name,
        kind: v.kind,
        ballotId: b.id,
        excluded: b.excluded,
      };
    });
  const notVoted = voters
    .filter((v) => !byVoter.has(v.voterId))
    .map((v) => ({ voterId: v.voterId, name: v.name, kind: v.kind }));

  // Votos registrados por el entrenador en nombre de jugadores sin cuenta.
  const obh = poll.ballots.filter((b) => b.onBehalfOfId);
  const obhPlayers = obh.length
    ? await prisma.player.findMany({
        where: { id: { in: obh.map((b) => b.onBehalfOfId as string) } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const obhName = new Map(
    obhPlayers.map((p) => [p.id, `${p.firstName} ${p.lastName}`]),
  );
  const onBehalf = obh.map((b) => ({
    ballotId: b.id,
    name: obhName.get(b.onBehalfOfId as string) ?? "Jugador",
    excluded: b.excluded,
  }));

  return {
    poll,
    eligibleCount: voters.length,
    votedCount: voters.filter((v) => nonExcluded.has(v.voterId)).length,
    voted,
    notVoted,
    onBehalf,
  };
}

// ───────────────────── LIGA interna: puntos por ejercicio ─────────────────────

// Entradas ya asignadas de un ejercicio (para precargar "ASIGNAR PUNTOS").
export async function exerciseEntries(exerciseId: string) {
  return prisma.leaguePointEntry.findMany({
    where: { exerciseId },
    select: { playerId: true, points: true, note: true },
  });
}

// Historial de puntos de LIGA de un jugador. priorBalance = saldo anterior no
// itemizado (ajustes manuales/históricos previos a esta función).
export async function playerLeagueHistory(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { leaguePoints: true },
  });
  const total = player?.leaguePoints ?? 0;

  // El detalle del historial no debe poder tumbar la ficha: si su consulta falla
  // (p. ej. tabla no migrada todavía) se registra y se devuelve el total, que es
  // la fuente de verdad de la LIGA interna.
  type Entry = {
    id: string;
    date: Date;
    exerciseName: string | null;
    exerciseId: string | null;
    points: number;
    note: string | null;
  };
  let entries: Entry[] = [];
  try {
    entries = await prisma.leaguePointEntry.findMany({
      where: { playerId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        date: true,
        exerciseName: true,
        exerciseId: true,
        points: true,
        note: true,
      },
    });
  } catch (err) {
    console.error("playerLeagueHistory", playerId, err);
    entries = [];
  }

  const sum = entries.reduce((a, e) => a + e.points, 0);
  return { total, priorBalance: total - sum, entries };
}

// Resuelve una ficha admitiendo tanto el id de jugador como el id de la cuenta,
// para que la pantalla nunca falle por recibir un identificador de otro tipo
// ni muestre la ficha de otro jugador.
export async function findPlayerByAnyId(id: string) {
  if (!id) return null;
  const byPlayer = await prisma.player.findUnique({ where: { id } });
  if (byPlayer) return byPlayer;
  return prisma.player.findFirst({ where: { userId: id } });
}

// ───────────────── Documentos del equipo (Régimen Interno / Material) ─────────────────

// Devuelve el documento vigente de una categoría. Si la consulta falla (por
// ejemplo, tabla aún no migrada) se registra y se devuelve null: la pantalla
// muestra el estado vacío controlado en lugar de romper la aplicación.
export async function teamDocument(kind: DocKind) {
  try {
    return await prisma.teamDocument.findUnique({
      where: { kind },
      select: { fileName: true, fileMime: true, updatedAt: true },
    });
  } catch (err) {
    console.error("teamDocument", kind, err);
    return null;
  }
}

// ─────────────────── Multas: miembros sancionables y deuda personal ───────────────────

// Cuerpo técnico sancionable: cuentas con rol de entrenador.
export async function staffLite() {
  const staff = await prisma.user.findMany({
    where: { role: "COACH" },
    orderBy: [{ displayName: "asc" }, { username: "asc" }],
    select: { id: true, username: true, displayName: true },
  });
  return staff.map((u) => ({
    id: u.id,
    name: u.displayName?.trim() || u.username,
  }));
}

// Cantidad pagada efectiva (compatible con multas antiguas marcadas "paid" sin importe).
export function paidOfFine(f: {
  amountPaid: number;
  paid: boolean;
  amount: number;
}) {
  return Math.min(
    f.amountPaid > 0 ? f.amountPaid : f.paid ? f.amount : 0,
    f.amount,
  );
}

// LÓGICA CENTRAL de deuda personal: alimenta el punto rojo del menú y la
// tarjeta "MIS MULTAS", de modo que nunca puedan contradecirse.
// Incluye todas las multas del usuario (mes actual y meses anteriores) y
// considera deuda cualquier cantidad pendiente > 0 (también en pagos parciales).
export async function myFinesSummary() {
  const s = await getSession();
  if (!s) return { pending: 0, total: 0, paid: 0, count: 0, hasDebt: false };

  try {
    const me = await prisma.player.findFirst({
      where: { userId: s.userId },
      select: { id: true },
    });

    const or: { playerId?: string; staffUserId?: string }[] = [
      { staffUserId: s.userId },
    ];
    if (me) or.push({ playerId: me.id });

    const fines = await prisma.fine.findMany({
      where: { OR: or },
      select: { amount: true, amountPaid: true, paid: true },
    });

    let total = 0,
      paid = 0;
    for (const f of fines) {
      total += f.amount;
      paid += paidOfFine(f);
    }
    const pending = Math.max(0, total - paid);
    return {
      pending,
      total,
      paid,
      count: fines.length,
      hasDebt: pending > 0,
    };
  } catch (err) {
    // Nunca debe tumbar el menú ni la pantalla de multas.
    console.error("myFinesSummary", err);
    return { pending: 0, total: 0, paid: 0, count: 0, hasDebt: false };
  }
}

// ¿Puede el usuario cambiar el estado de pago? Rol entrenador o permiso económico.
export async function canManageFinePayments() {
  const s = await getSession();
  if (!s) return false;
  if (s.role === "COACH") return true;
  try {
    const u = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { canManageFinePayments: true },
    });
    return !!u?.canManageFinePayments;
  } catch (err) {
    console.error("canManageFinePayments", err);
    return false;
  }
}
