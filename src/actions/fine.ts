"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { FineInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

function clampPaid(amountPaid: number, amount: number) {
  if (!Number.isFinite(amountPaid) || amountPaid < 0) return 0;
  return Math.min(amountPaid, amount);
}

// Crea una multa por cada jugador seleccionado (empiezan sin pagar).
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
      amountPaid: 0,
      paid: false,
    })),
  });
  revalidatePath("/multas");
  return { ok: true as const };
}

export async function updateFine(
  id: string,
  input: {
    date: string;
    concept: string;
    amount: number;
    amountPaid?: number;
  },
) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (!(input.amount > 0))
    return { ok: false as const, error: "El importe debe ser mayor que 0." };
  const paidAmt = clampPaid(input.amountPaid ?? 0, input.amount);
  await prisma.fine.update({
    where: { id },
    data: {
      date: input.date ? new Date(input.date) : new Date(),
      concept: input.concept?.trim() || "Multa",
      amount: input.amount,
      amountPaid: paidAmt,
      paid: paidAmt >= input.amount,
    },
  });
  revalidatePath("/multas");
  return { ok: true as const };
}

// Registra un pago (total o parcial). No puede superar el importe.
export async function setFinePayment(id: string, amountPaid: number) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const fine = await prisma.fine.findUnique({ where: { id } });
  if (!fine) return { ok: false as const, error: "Multa no encontrada." };
  const paidAmt = clampPaid(amountPaid, fine.amount);
  await prisma.fine.update({
    where: { id },
    data: { amountPaid: paidAmt, paid: paidAmt >= fine.amount },
  });
  revalidatePath("/multas");
  return { ok: true as const };
}

// Marca como pagada por completo o vuelve a pendiente (atajo).
export async function setFinePaid(id: string, paid: boolean) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const fine = await prisma.fine.findUnique({ where: { id } });
  if (!fine) return { ok: false as const, error: "Multa no encontrada." };
  await prisma.fine.update({
    where: { id },
    data: { paid, amountPaid: paid ? fine.amount : 0 },
  });
  revalidatePath("/multas");
  return { ok: true as const };
}

export async function deleteFine(id: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.fine.delete({ where: { id } });
  revalidatePath("/multas");
  return { ok: true as const };
}
