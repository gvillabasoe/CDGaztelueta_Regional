"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { SaveMatchInput } from "@/lib/types";

async function isCoach() {
  const s = await getSession();
  return Boolean(s && s.role === "COACH");
}

function childCreates(input: SaveMatchInput) {
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
    fines: {
      create: input.fines
        .filter((f) => f.playerIds.length > 0 && f.amount > 0)
        .map((f) => ({
          amount: f.amount,
          reason: f.reason,
          players: { connect: f.playerIds.map((id) => ({ id })) },
        })),
    },
  };
}

function scalarData(input: SaveMatchInput) {
  return {
    date: new Date(input.date),
    opponent: input.opponent,
    formation: input.formation || null,
    teamGoals: input.teamGoals,
    opponentGoals: input.opponentGoals,
    globalGrade: input.globalGrade,
    generalObservations: input.generalObservations || null,
  };
}

export async function saveMatch(input: SaveMatchInput) {
  if (!(await isCoach()))
    return { ok: false as const, error: "No autorizado." };

  await prisma.matchRecord.create({
    data: { ...scalarData(input), ...childCreates(input) },
  });

  revalidatePath("/coach/home");
  revalidatePath("/coach/registro");
  return { ok: true as const };
}

export async function updateMatch(id: string, input: SaveMatchInput) {
  if (!(await isCoach()))
    return { ok: false as const, error: "No autorizado." };

  await prisma.$transaction([
    prisma.matchGoal.deleteMany({ where: { matchId: id } }),
    prisma.substitution.deleteMany({ where: { matchId: id } }),
    prisma.matchCard.deleteMany({ where: { matchId: id } }),
    prisma.matchPlayer.deleteMany({ where: { matchId: id } }),
    prisma.fine.deleteMany({ where: { matchId: id } }),
    prisma.matchRecord.update({
      where: { id },
      data: { ...scalarData(input), ...childCreates(input) },
    }),
  ]);

  revalidatePath("/coach/home");
  revalidatePath("/coach/registro");
  return { ok: true as const };
}
