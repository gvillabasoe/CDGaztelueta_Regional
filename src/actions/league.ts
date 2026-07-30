"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

// Fija el total de puntos de la liga interna de un jugador.
export async function setPlayerPoints(playerId: string, points: number) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.player.update({
    where: { id: playerId },
    data: { leaguePoints: Math.round(points) || 0 },
  });
  revalidatePath("/liga");
  return { ok: true as const };
}

// Suma o resta puntos.
export async function adjustPlayerPoints(playerId: string, delta: number) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.player.update({
    where: { id: playerId },
    data: { leaguePoints: { increment: Math.round(delta) } },
  });
  revalidatePath("/liga");
  return { ok: true as const };
}
