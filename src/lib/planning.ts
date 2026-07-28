import { prisma } from "@/lib/prisma";
import { formatDateShort, toDateInputValue } from "@/lib/format";
import {
  dateToIsoWeek,
  dayName,
  plannedDateTime,
} from "@/lib/week";
import type {
  FineInput,
  MatchPlayerInput,
  TrainingPlayerInput,
} from "@/lib/types";

export function weekLabel(weekStart: Date): string {
  const sunday = new Date(weekStart);
  sunday.setDate(weekStart.getDate() + 6);
  return `Semana del ${formatDateShort(weekStart)} al ${formatDateShort(sunday)}`;
}

export async function planExists(): Promise<boolean> {
  const n = await prisma.weeklyPlan.count();
  return n > 0;
}

// ── Resumen de planificaciones para el menú de Registro ───────────
export type PlanSummary = {
  id: string;
  weekLabel: string;
  trainingsCount: number;
  hasMatch: boolean;
  fileName: string | null;
};

export async function getPlansSummary(): Promise<PlanSummary[]> {
  const plans = await prisma.weeklyPlan.findMany({
    orderBy: { weekStart: "desc" },
    include: {
      match: { select: { id: true, date: true, place: true } },
      _count: { select: { trainings: true } },
    },
  });
  return plans.map((p) => ({
    id: p.id,
    weekLabel: weekLabel(p.weekStart),
    trainingsCount: p._count.trainings,
    hasMatch: Boolean(
      p.match && (p.match.date || p.match.place),
    ),
    fileName: p.fileName,
  }));
}

// ── Entrenamientos planificados seleccionables (sin registro) ─────
export type SelectableTraining = {
  id: string;
  weekLabel: string;
  dayLabel: string;
  dateLabel: string;
};

export async function getSelectableTrainings(): Promise<SelectableTraining[]> {
  const trainings = await prisma.plannedTraining.findMany({
    where: { record: { is: null } },
    include: { plan: true },
  });
  const withDt = trainings.map((t) => ({
    row: {
      id: t.id,
      weekLabel: weekLabel(t.plan.weekStart),
      dayLabel: `${dayName(t.dayOfWeek)} · ${t.time}`,
      dateLabel: formatDateShort(
        plannedDateTime(t.plan.weekStart, t.dayOfWeek, t.time),
      ),
    },
    dt: plannedDateTime(t.plan.weekStart, t.dayOfWeek, t.time).getTime(),
  }));
  withDt.sort((a, b) => a.dt - b.dt);
  return withDt.map((x) => x.row);
}

// Datos de un entrenamiento planificado para iniciar su registro.
export async function getPlannedTrainingForRegistro(id: string) {
  const t = await prisma.plannedTraining.findUnique({
    where: { id },
    include: { plan: true, record: { select: { id: true } } },
  });
  if (!t) return null;
  const dt = plannedDateTime(t.plan.weekStart, t.dayOfWeek, t.time);
  return {
    id: t.id,
    hasRecord: Boolean(t.record),
    weekLabel: weekLabel(t.plan.weekStart),
    dayLabel: `${dayName(t.dayOfWeek)} · ${t.time}`,
    defaultDate: toDateInputValue(dt),
  };
}

// ── Plan completo para edición (PlanEditor) ───────────────────────
export async function getPlanForEdit(id: string) {
  const plan = await prisma.weeklyPlan.findUnique({
    where: { id },
    include: {
      trainings: {
        orderBy: { orderIndex: "asc" },
        include: { exercises: { orderBy: { orderIndex: "asc" } } },
      },
      match: { include: { calledPlayers: { select: { id: true } } } },
    },
  });
  if (!plan) return null;
  return {
    id: plan.id,
    week: dateToIsoWeek(plan.weekStart),
    fileName: plan.fileName,
    trainings: plan.trainings.map((t) => ({
      id: t.id,
      dayOfWeek: t.dayOfWeek,
      time: t.time,
      exercises: t.exercises.map((e) => ({
        id: e.id,
        task: e.task,
        description: e.description,
        objective: e.objective,
        duration: e.duration,
      })),
    })),
    match: {
      date: plan.match?.date ? toDateInputValue(plan.match.date) : null,
      place: plan.match?.place ?? null,
      time: plan.match?.time ?? null,
      callTime: plan.match?.callTime ?? null,
      kitLocal: plan.match?.kitLocal ?? true,
      calledPlayerIds: plan.match?.calledPlayers.map((p) => p.id) ?? [],
    },
  };
}

// ── Registros guardados (para la lista editable, req. 7) ──────────
export type SavedTrainingRow = { id: string; dateLabel: string; sub: string };
export type SavedMatchRow = { id: string; dateLabel: string; opponent: string };

export async function getSavedTrainingRecords(): Promise<SavedTrainingRow[]> {
  const recs = await prisma.trainingRecord.findMany({
    orderBy: { date: "desc" },
    include: {
      plannedTraining: { include: { plan: true } },
      _count: { select: { players: true } },
    },
  });
  return recs.map((r) => ({
    id: r.id,
    dateLabel: formatDateShort(r.date),
    sub: r.plannedTraining
      ? `${dayName(r.plannedTraining.dayOfWeek)} · ${weekLabel(r.plannedTraining.plan.weekStart)}`
      : `${r._count.players} jugadores`,
  }));
}

export async function getSavedMatchRecords(): Promise<SavedMatchRow[]> {
  const recs = await prisma.matchRecord.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      opponent: true,
      teamGoals: true,
      opponentGoals: true,
    },
  });
  return recs.map((r) => ({
    id: r.id,
    dateLabel: formatDateShort(r.date),
    opponent: `${r.opponent} (${r.teamGoals}-${r.opponentGoals})`,
  }));
}

// ── Prefill de edición de registros ───────────────────────────────
export async function getTrainingRecordForEdit(id: string) {
  const rec = await prisma.trainingRecord.findUnique({
    where: { id },
    include: {
      players: true,
      fines: { include: { players: { select: { id: true } } } },
    },
  });
  if (!rec) return null;
  const players: TrainingPlayerInput[] = rec.players.map((p) => ({
    playerId: p.playerId,
    attended: p.attended,
    justified: p.justified,
    absenceReason: p.absenceReason,
    grade: p.grade,
    observations: p.observations,
  }));
  const fines: FineInput[] = rec.fines.map((f) => ({
    playerIds: f.players.map((p) => p.id),
    amount: f.amount,
    reason: f.reason,
  }));
  return { date: toDateInputValue(rec.date), players, fines };
}

export async function getMatchRecordForEdit(id: string) {
  const rec = await prisma.matchRecord.findUnique({
    where: { id },
    include: {
      players: true,
      goals: true,
      substitutions: true,
      cards: true,
      fines: { include: { players: { select: { id: true } } } },
    },
  });
  if (!rec) return null;
  const players: MatchPlayerInput[] = rec.players.map((p) => ({
    playerId: p.playerId,
    isStarter: p.isStarter,
    position: p.position,
    grade: p.grade,
    observations: p.observations,
  }));
  const fines: FineInput[] = rec.fines.map((f) => ({
    playerIds: f.players.map((p) => p.id),
    amount: f.amount,
    reason: f.reason,
  }));
  return {
    date: toDateInputValue(rec.date),
    opponent: rec.opponent,
    formation: rec.formation,
    teamGoals: rec.teamGoals,
    opponentGoals: rec.opponentGoals,
    globalGrade: rec.globalGrade,
    generalObservations: rec.generalObservations,
    players,
    goals: rec.goals.map((g) => ({ playerId: g.playerId, minute: g.minute })),
    substitutions: rec.substitutions.map((s) => ({
      playerOutId: s.playerOutId,
      playerInId: s.playerInId,
      minute: s.minute,
    })),
    cards: rec.cards.map((c) => ({ playerId: c.playerId, type: c.type })),
    fines,
  };
}

// ── Archivos de planificación (visibles por jugadores, req. 3) ────
export type PlanFileRow = { id: string; weekLabel: string; fileName: string };

export async function getPlanFiles(): Promise<PlanFileRow[]> {
  const plans = await prisma.weeklyPlan.findMany({
    where: { NOT: { fileName: null } },
    orderBy: { weekStart: "desc" },
    select: { id: true, weekStart: true, fileName: true },
  });
  return plans.map((p) => ({
    id: p.id,
    weekLabel: weekLabel(p.weekStart),
    fileName: p.fileName as string,
  }));
}

// ── Último entrenamiento para el jugador (req. 8) ─────────────────
export type LastTrainingView = {
  id: string;
  weekLabel: string;
  dayLabel: string;
  dateLabel: string;
  exercises: {
    id: string;
    task: string;
    description: string | null;
    objective: string | null;
    duration: string | null;
  }[];
} | null;

export async function getLastPlannedTraining(): Promise<LastTrainingView> {
  const all = await prisma.plannedTraining.findMany({
    include: {
      plan: true,
      exercises: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (all.length === 0) return null;

  const now = Date.now();
  const withDt = all.map((t) => ({
    t,
    dt: plannedDateTime(t.plan.weekStart, t.dayOfWeek, t.time).getTime(),
  }));
  const past = withDt
    .filter((x) => x.dt <= now)
    .sort((a, b) => b.dt - a.dt);
  const chosen =
    past[0] ?? [...withDt].sort((a, b) => a.dt - b.dt)[0];
  const t = chosen.t;

  return {
    id: t.id,
    weekLabel: weekLabel(t.plan.weekStart),
    dayLabel: `${dayName(t.dayOfWeek)} · ${t.time}`,
    dateLabel: formatDateShort(
      plannedDateTime(t.plan.weekStart, t.dayOfWeek, t.time),
    ),
    exercises: t.exercises.map((e) => ({
      id: e.id,
      task: e.task,
      description: e.description,
      objective: e.objective,
      duration: e.duration,
    })),
  };
}

// Valoraciones existentes del jugador para un conjunto de ejercicios.
export async function getPlayerRatings(
  playerId: string,
  exerciseIds: string[],
): Promise<Record<string, number>> {
  if (exerciseIds.length === 0) return {};
  const ratings = await prisma.exerciseRating.findMany({
    where: { playerId, exerciseId: { in: exerciseIds } },
  });
  const map: Record<string, number> = {};
  for (const r of ratings) map[r.exerciseId] = r.rating;
  return map;
}

// Jugador asociado al usuario de la sesión.
export async function getPlayerByUserId(userId: string) {
  return prisma.player.findFirst({ where: { userId } });
}

// Lista de jugadores (para formularios y convocatoria).
export async function getPlayersLite() {
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
