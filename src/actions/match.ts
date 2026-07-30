"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { SaveMatchInput, NewFineInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

function children(input: SaveMatchInput) {
  return {
    players: {
      create: input.players.map((p) => ({
        playerId: p.playerId,
        isStarter: p.isStarter,
        position: p.position || null,
        grade: p.grade,
        observations: p.observations || null,
      })),
    },
    goals: {
      create: input.goals
        .filter((g) => g.playerId)
        .map((g) => ({ playerId: g.playerId, minute: g.minute })),
    },
    substitutions: {
      create: input.substitutions
        .filter((s) => s.playerOutId && s.playerInId)
        .map((s) => ({
          playerOutId: s.playerOutId,
          playerInId: s.playerInId,
          minute: s.minute,
        })),
    },
    cards: {
      create: input.cards
        .filter((c) => c.playerId)
        .map((c) => ({ playerId: c.playerId, type: c.type })),
    },
  };
}

function scalar(input: SaveMatchInput) {
  return {
    date: new Date(input.date),
    opponent: input.opponent?.trim() || null,
    formation: input.formation?.trim() || null,
    teamGoals: input.teamGoals,
    opponentGoals: input.opponentGoals,
    globalGrade: input.globalGrade,
    generalObservations: input.generalObservations?.trim() || null,
  };
}

async function addFines(newFines: NewFineInput[]) {
  const rows: {
    playerId: string;
    date: Date;
    concept: string;
    amount: number;
  }[] = [];
  for (const f of newFines) {
    if (!(f.amount > 0) || f.playerIds.length === 0) continue;
    const d = f.date ? new Date(f.date) : new Date();
    const concept = f.concept?.trim() || "Multa";
    for (const pid of f.playerIds)
      rows.push({ playerId: pid, date: d, concept, amount: f.amount });
  }
  if (rows.length) await prisma.fine.createMany({ data: rows });
}

export async function saveMatch(input: SaveMatchInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const activity = await prisma.activity.findUnique({
    where: { id: input.activityId },
    include: { matchRecord: { select: { id: true } } },
  });
  if (!activity || activity.type !== "MATCH")
    return { ok: false as const, error: "La actividad no es un partido válido." };
  if (activity.matchRecord)
    return {
      ok: false as const,
      error: "Ese partido ya tiene un registro. Edítalo desde la actividad.",
    };

  await prisma.matchRecord.create({
    data: { activityId: input.activityId, ...scalar(input), ...children(input) },
  });
  await addFines(input.newFines);

  revalidatePath("/planificacion");
  revalidatePath(`/planificacion/actividad/${input.activityId}`);
  revalidatePath("/multas");
  return { ok: true as const };
}

export async function updateMatch(recordId: string, input: SaveMatchInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.$transaction([
    prisma.matchGoal.deleteMany({ where: { recordId } }),
    prisma.substitution.deleteMany({ where: { recordId } }),
    prisma.matchCard.deleteMany({ where: { recordId } }),
    prisma.matchPlayer.deleteMany({ where: { recordId } }),
    prisma.matchRecord.update({
      where: { id: recordId },
      data: { ...scalar(input), ...children(input) },
    }),
  ]);
  await addFines(input.newFines);

  revalidatePath("/planificacion");
  revalidatePath(`/planificacion/actividad/${input.activityId}`);
  revalidatePath("/multas");
  return { ok: true as const };
}
