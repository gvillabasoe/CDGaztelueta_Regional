"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { SaveTrainingInput } from "@/lib/types";

export async function saveTraining(input: SaveTrainingInput) {
  const session = await getSession();
  if (!session || session.role !== "COACH") {
    return { ok: false as const, error: "No autorizado." };
  }

  await prisma.trainingRecord.create({
    data: {
      date: new Date(input.date),
      players: {
        create: input.players.map((p) => ({
          playerId: p.playerId,
          attended: p.attended,
          justified: p.attended ? null : p.justified,
          absenceReason: p.attended ? null : p.absenceReason || null,
          grade: p.grade,
          observations: p.observations || null,
        })),
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
    },
  });

  revalidatePath("/coach/home");
  return { ok: true as const };
}
