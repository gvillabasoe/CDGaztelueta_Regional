"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { FineInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

// Crea una multa por cada jugador seleccionado (10).
export async function createFines(input: FineInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (input.playerIds.length === 0)
    return { ok: false as const, error: "Selecciona al menos un jugador." };
  if (!(input.amount > 0))
    return { ok: false as const, error: "El importe debe ser mayor que 0." };
  const d = input.date ? new Date(input.date) : new Date();
  const concept = input.concept?.trim() || "Multa";
  await prisma.fine.createMany({
    data: input.playerIds.map((pid) => ({
      playerId: pid,
      date: d,
      concept,
      amount: input.amount,
    })),
  });
  revalidatePath("/multas");
  return { ok: true as const };
}

export async function updateFine(
  id: string,
  input: { date: string; concept: string; amount: number; paid: boolean },
) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (!(input.amount > 0))
    return { ok: false as const, error: "El importe debe ser mayor que 0." };
  await prisma.fine.update({
    where: { id },
    data: {
      date: input.date ? new Date(input.date) : new Date(),
      concept: input.concept?.trim() || "Multa",
      amount: input.amount,
      paid: input.paid,
    },
  });
  revalidatePath("/multas");
  return { ok: true as const };
}

export async function setFinePaid(id: string, paid: boolean) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.fine.update({ where: { id }, data: { paid } });
  revalidatePath("/multas");
  return { ok: true as const };
}

export async function deleteFine(id: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.fine.delete({ where: { id } });
  revalidatePath("/multas");
  return { ok: true as const };
}
