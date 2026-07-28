"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { SaveTrainingInput } from "@/lib/types";

async function isCoach() {
  const s = await getSession();
  return Boolean(s && s.role === "COACH");
}

function playerCreates(players: SaveTrainingInput["players"]) {
  return players.map((p) => ({
    playerId: p.playerId,
    attended: p.attended,
    justified: p.attended ? null : p.justified,
    absenceReason: p.attended ? null : p.absenceReason || null,
    grade: p.grade,
    observations: p.observations || null,
  }));
}

function fineCreates(fines: SaveTrainingInput["fines"]) {
  return fines
    .filter((f) => f.playerIds.length > 0 && f.amount > 0)
    .map((f) => ({
      amount: f.amount,
      reason: f.reason,
      players: { connect: f.playerIds.map((id) => ({ id })) },
    }));
}

export async function saveTraining(input: SaveTrainingInput) {
  if (!(await isCoach()))
    return { ok: false as const, error: "No autorizado." };

  // El registro requiere una planificación previa (req. 6).
  if (!input.plannedTrainingId)
    return {
      ok: false as const,
      error: "Debes seleccionar el entrenamiento de la planificación semanal.",
    };

  await prisma.trainingRecord.create({
    data: {
      date: new Date(input.date),
      plannedTrainingId: input.plannedTrainingId,
      players: { create: playerCreates(input.players) },
      fines: { create: fineCreates(input.fines) },
    },
  });

  revalidatePath("/coach/home");
  revalidatePath("/coach/registro");
  return { ok: true as const };
}

export async function updateTraining(id: string, input: SaveTrainingInput) {
  if (!(await isCoach()))
    return { ok: false as const, error: "No autorizado." };

  await prisma.$transaction([
    prisma.trainingPlayer.deleteMany({ where: { trainingId: id } }),
    prisma.fine.deleteMany({ where: { trainingId: id } }),
    prisma.trainingRecord.update({
      where: { id },
      data: {
        date: new Date(input.date),
        players: { create: playerCreates(input.players) },
        fines: { create: fineCreates(input.fines) },
      },
    }),
  ]);

  revalidatePath("/coach/home");
  revalidatePath("/coach/registro");
  return { ok: true as const };
}
