"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { ExerciseRatingInput } from "@/lib/types";

export async function saveExerciseRatings(ratings: ExerciseRatingInput[]) {
  const s = await getSession();
  if (!s || s.role !== "PLAYER")
    return { ok: false as const, error: "No autorizado." };
  const player = await prisma.player.findFirst({ where: { userId: s.userId } });
  if (!player)
    return { ok: false as const, error: "No se ha encontrado el jugador." };

  const valid = ratings.filter(
    (r) => r.exerciseId && r.rating >= 1 && r.rating <= 10,
  );
  if (valid.length > 0) {
    await prisma.$transaction(
      valid.map((r) =>
        prisma.exerciseRating.upsert({
          where: {
            exerciseId_playerId: {
              exerciseId: r.exerciseId,
              playerId: player.id,
            },
          },
          create: {
            exerciseId: r.exerciseId,
            playerId: player.id,
            rating: r.rating,
          },
          update: { rating: r.rating },
        }),
      ),
    );
  }
  revalidatePath("/mas/perfil");
  return { ok: true as const };
}
