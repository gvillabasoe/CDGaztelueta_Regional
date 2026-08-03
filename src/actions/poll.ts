"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  matchMonthKey,
  defaultPollClose,
  parseMadridLocal,
} from "@/lib/deadlines";
import { revalidatePath } from "next/cache";
import type { CreatePollInput, BallotInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

function refresh(activityId?: string) {
  revalidatePath("/equipo/jugador-del-mes");
  revalidatePath("/equipo/jugador-del-mes/admin");
  if (activityId) revalidatePath(`/planificacion/actividad/${activityId}`);
}

async function logVote(
  adminId: string,
  adminName: string,
  pollId: string,
  action: string,
  ballotId?: string | null,
  note?: string,
) {
  await prisma.voteLog.create({
    data: { pollId, ballotId: ballotId ?? null, adminId, adminName, action, note: note ?? null },
  });
}

// Crear votación vinculada a un partido (§15). Una por partido, sin duplicar.
export async function createPoll(input: CreatePollInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };

  const activity = await prisma.activity.findUnique({
    where: { id: input.activityId },
    include: { poll: { select: { id: true } } },
  });
  if (!activity || activity.type !== "MATCH")
    return { ok: false as const, error: "La votación debe vincularse a un partido." };
  if (activity.poll)
    return { ok: false as const, error: "Ese partido ya tiene una votación." };

  // Solo candidatos activos y elegibles.
  const activeCandidates = await prisma.player.findMany({
    where: { id: { in: input.candidateIds }, status: "ACTIVE" },
    select: { id: true },
  });
  if (activeCandidates.length < 3)
    return {
      ok: false as const,
      error: "Selecciona al menos 3 jugadores candidatos activos.",
    };

  const now = new Date();
  let closesAt: Date;
  if (input.closesAt) {
    const parsed = parseMadridLocal(input.closesAt);
    if (!parsed)
      return { ok: false as const, error: "Fecha de cierre no válida." };
    closesAt = parsed;
    if (closesAt <= now)
      return {
        ok: false as const,
        error: "La fecha de cierre debe ser futura.",
      };
  } else {
    closesAt = defaultPollClose(activity.date);
    if (closesAt <= now)
      return {
        ok: false as const,
        needsDeadline: true as const,
        error:
          "La fecha de cierre por defecto (martes 23:59) ya ha pasado. Indica una fecha de cierre excepcional.",
      };
  }

  await prisma.poll.create({
    data: {
      activityId: activity.id,
      monthKey: matchMonthKey(activity.date),
      closesAt,
      status: "OPEN",
      allowSelfVote: input.allowSelfVote,
      candidates: { connect: activeCandidates.map((c) => ({ id: c.id })) },
    },
  });
  refresh(activity.id);
  return { ok: true as const };
}

// Emitir papeleta 3-2-1 (§16). Una por cuenta y partido; anónima.
export async function castBallot(input: BallotInput) {
  const s = await getSession();
  if (!s) return { ok: false as const, error: "No autorizado." };

  let myPlayerId: string | null = null;
  if (s.role === "PLAYER") {
    const me = await prisma.player.findFirst({
      where: { userId: s.userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!me) return { ok: false as const, error: "Tu ficha no está activa." };
    myPlayerId = me.id;
  } else if (s.role === "COACH") {
    const u = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { canVote: true },
    });
    if (!u?.canVote)
      return { ok: false as const, error: "No tienes permiso para votar." };
  } else {
    return { ok: false as const, error: "No autorizado." };
  }

  const poll = await prisma.poll.findUnique({
    where: { id: input.pollId },
    include: { candidates: { select: { id: true } } },
  });
  if (!poll) return { ok: false as const, error: "Votación no encontrada." };
  if (poll.status === "CANCELLED")
    return { ok: false as const, error: "La votación está anulada." };
  const now = new Date();
  if (poll.status === "CLOSED" || now >= poll.closesAt)
    return { ok: false as const, error: "La votación de este partido ha finalizado." };

  const { firstId, secondId, thirdId } = input;
  if (!firstId || !secondId || !thirdId)
    return { ok: false as const, error: "Debes seleccionar 3 jugadores." };
  if (firstId === secondId || firstId === thirdId || secondId === thirdId)
    return { ok: false as const, error: "Los tres jugadores deben ser distintos." };

  const candSet = new Set(poll.candidates.map((c) => c.id));
  if (![firstId, secondId, thirdId].every((id) => candSet.has(id)))
    return { ok: false as const, error: "Solo puedes votar a los candidatos." };

  if (!poll.allowSelfVote && myPlayerId && [firstId, secondId, thirdId].includes(myPlayerId))
    return { ok: false as const, error: "No puedes votarte a ti mismo." };

  const existing = await prisma.ballot.findUnique({
    where: { pollId_voterId: { pollId: poll.id, voterId: s.userId } },
  });
  if (existing)
    return { ok: false as const, error: "Ya has votado en este partido." };

  await prisma.ballot.create({
    data: {
      pollId: poll.id,
      voterId: s.userId,
      firstId,
      secondId,
      thirdId,
    },
  });
  refresh(poll.activityId);
  return { ok: true as const };
}

export async function closePollNow(pollId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const poll = await prisma.poll.update({
    where: { id: pollId },
    data: { status: "CLOSED" },
    select: { activityId: true },
  });
  refresh(poll.activityId);
  return { ok: true as const };
}

export async function extendPoll(pollId: string, closesAt: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const d = parseMadridLocal(closesAt);
  if (!d) return { ok: false as const, error: "Fecha no válida." };
  if (d <= new Date())
    return { ok: false as const, error: "La fecha debe ser futura." };
  const poll = await prisma.poll.update({
    where: { id: pollId },
    data: { closesAt: d, status: "OPEN" },
    select: { activityId: true },
  });
  refresh(poll.activityId);
  return { ok: true as const };
}

export async function cancelPoll(pollId: string) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  const poll = await prisma.poll.update({
    where: { id: pollId },
    data: { status: "CANCELLED" },
    select: { activityId: true },
  });
  await logVote(s.userId, s.username, pollId, "cancel_poll");
  refresh(poll.activityId);
  return { ok: true as const };
}

export async function setPollMonth(pollId: string, monthKey: string) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  if (!/^\d{4}-\d{2}$/.test(monthKey))
    return { ok: false as const, error: "Mes no válido (usa AAAA-MM)." };
  const poll = await prisma.poll.update({
    where: { id: pollId },
    data: { monthKey },
    select: { activityId: true },
  });
  await logVote(s.userId, s.username, pollId, "change_month", null, monthKey);
  refresh(poll.activityId);
  return { ok: true as const };
}

export async function setSelfVote(pollId: string, allow: boolean) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const poll = await prisma.poll.update({
    where: { id: pollId },
    data: { allowSelfVote: allow },
    select: { activityId: true },
  });
  refresh(poll.activityId);
  return { ok: true as const };
}

export async function excludeBallot(ballotId: string, excluded: boolean) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  const b = await prisma.ballot.update({
    where: { id: ballotId },
    data: { excluded },
    select: { pollId: true, poll: { select: { activityId: true } } },
  });
  await logVote(
    s.userId,
    s.username,
    b.pollId,
    excluded ? "annul_ballot" : "restore_ballot",
    ballotId,
  );
  refresh(b.poll.activityId);
  return { ok: true as const };
}

// El cálculo es en vivo; "recalcular" simplemente refresca la vista.
export async function recalcPoll(pollId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { activityId: true },
  });
  refresh(poll?.activityId);
  return { ok: true as const };
}

// Voto excepcional del entrenador en nombre de un jugador activo SIN cuenta (19).
export async function castBallotOnBehalf(
  pollId: string,
  playerId: string,
  firstId: string,
  secondId: string,
  thirdId: string,
) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { candidates: { select: { id: true } } },
  });
  if (!poll) return { ok: false as const, error: "Votación no encontrada." };
  if (poll.status === "CANCELLED")
    return { ok: false as const, error: "La votación está anulada." };
  const now = new Date();
  if (poll.status === "CLOSED" || now >= poll.closesAt)
    return { ok: false as const, error: "La votación de este partido ha finalizado." };

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { status: true, userId: true },
  });
  if (!player || player.status !== "ACTIVE" || player.userId)
    return {
      ok: false as const,
      error: "El voto excepcional es solo para jugadores activos sin cuenta.",
    };

  if (!firstId || !secondId || !thirdId)
    return { ok: false as const, error: "Debes seleccionar 3 jugadores." };
  if (firstId === secondId || firstId === thirdId || secondId === thirdId)
    return { ok: false as const, error: "Los tres jugadores deben ser distintos." };
  const candSet = new Set(poll.candidates.map((c) => c.id));
  if (![firstId, secondId, thirdId].every((id) => candSet.has(id)))
    return { ok: false as const, error: "Solo puedes votar a los candidatos." };
  if (!poll.allowSelfVote && [firstId, secondId, thirdId].includes(playerId))
    return { ok: false as const, error: "Ese jugador no puede votarse a sí mismo." };

  const voterId = `obh:${playerId}`;
  const existing = await prisma.ballot.findUnique({
    where: { pollId_voterId: { pollId, voterId } },
  });
  if (existing)
    return { ok: false as const, error: "Ya se registró el voto de ese jugador." };

  await prisma.ballot.create({
    data: { pollId, voterId, firstId, secondId, thirdId, onBehalfOfId: playerId },
  });
  await logVote(s.userId, s.username, pollId, "onbehalf_vote", null, playerId);
  refresh(poll.activityId);
  return { ok: true as const };
}

// Autorizar que un votante vuelva a votar: elimina su papeleta (libera el hueco). Queda en el registro.
export async function authorizeRevote(ballotId: string) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  const b = await prisma.ballot.findUnique({
    where: { id: ballotId },
    select: { pollId: true, poll: { select: { activityId: true } } },
  });
  if (!b) return { ok: false as const, error: "Papeleta no encontrada." };
  await prisma.ballot.delete({ where: { id: ballotId } });
  await logVote(s.userId, s.username, b.pollId, "authorize_revote", ballotId);
  refresh(b.poll.activityId);
  return { ok: true as const };
}

// Permiso de voto para el cuerpo técnico (18), separado de la administración.
export async function setCanVote(userId: string, allow: boolean) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  await prisma.user.update({ where: { id: userId }, data: { canVote: allow } });
  revalidatePath("/equipo/jugador-del-mes/admin");
  return { ok: true as const };
}
