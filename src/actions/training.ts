"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { SaveTrainingInput, NewFineInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
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

export async function saveTraining(input: SaveTrainingInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const activity = await prisma.activity.findUnique({
    where: { id: input.activityId },
    include: { trainingRecord: { select: { id: true } } },
  });
  if (!activity || activity.type !== "TRAINING")
    return { ok: false as const, error: "La actividad no es un entrenamiento válido." };
  if (activity.trainingRecord)
    return {
      ok: false as const,
      error: "Ese entrenamiento ya tiene un registro. Edítalo desde la actividad.",
    };

  await prisma.trainingRecord.create({
    data: {
      activityId: input.activityId,
      date: new Date(input.date),
      players: { create: playerCreates(input.players) },
    },
  });
  await addFines(input.newFines);

  revalidatePath("/planificacion");
  revalidatePath(`/planificacion/actividad/${input.activityId}`);
  revalidatePath("/multas");
  return { ok: true as const };
}

export async function updateTraining(recordId: string, input: SaveTrainingInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.$transaction([
    prisma.trainingPlayer.deleteMany({ where: { recordId } }),
    prisma.trainingRecord.update({
      where: { id: recordId },
      data: {
        date: new Date(input.date),
        players: { create: playerCreates(input.players) },
      },
    }),
  ]);
  await addFines(input.newFines);

  revalidatePath("/planificacion");
  revalidatePath(`/planificacion/actividad/${input.activityId}`);
  revalidatePath("/multas");
  return { ok: true as const };
}
