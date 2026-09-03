"use server";

import { prisma } from "@/lib/prisma";
import { awardPreview } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { FineInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

// Puede cambiar el estado de pago: rol entrenador O permiso económico específico.
// Este permiso NO concede crear, editar ni eliminar multas.
async function paymentManager() {
  const s = await getSession();
  if (!s) return null;
  if (s.role === "COACH") return s;
  const u = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { canManageFinePayments: true },
  });
  return u?.canManageFinePayments ? s : null;
}

function clampPaid(amountPaid: number, amount: number) {
  if (!Number.isFinite(amountPaid) || amountPaid < 0) return 0;
  return Math.min(amountPaid, amount);
}

// Crea una multa por cada jugador seleccionado (empiezan sin pagar).
export async function createFines(input: FineInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };

  // Sin duplicados aunque se repita una selección.
  const playerIds = [...new Set(input.playerIds ?? [])];
  const staffUserIds = [...new Set(input.staffUserIds ?? [])];
  if (playerIds.length + staffUserIds.length === 0)
    return {
      ok: false as const,
      error: "Selecciona al menos un jugador o un miembro del cuerpo técnico.",
    };
  if (!(input.amount > 0))
    return { ok: false as const, error: "El importe debe ser mayor que 0." };

  try {
    // Los destinatarios deben existir y ser válidos.
    if (playerIds.length) {
      const n = await prisma.player.count({ where: { id: { in: playerIds } } });
      if (n !== playerIds.length)
        return { ok: false as const, error: "Algún jugador no es válido." };
    }
    if (staffUserIds.length) {
      const n = await prisma.user.count({
        where: { id: { in: staffUserIds }, role: "COACH" },
      });
      if (n !== staffUserIds.length)
        return {
          ok: false as const,
          error: "Algún miembro del cuerpo técnico no es válido.",
        };
    }

    const d = input.date ? new Date(input.date) : new Date();
    const concept = input.concept?.trim() || "Multa";
    const base = {
      date: d,
      concept,
      amount: input.amount,
      amountPaid: 0,
      paid: false,
    };

    // Un registro por destinatario (nunca se duplica una misma multa).
    await prisma.fine.createMany({
      data: [
        ...playerIds.map((playerId) => ({ ...base, playerId })),
        ...staffUserIds.map((staffUserId) => ({ ...base, staffUserId })),
      ],
    });
    revalidatePath("/multas");
    return { ok: true as const };
  } catch (err) {
    console.error("createFines", err);
    return {
      ok: false as const,
      error: "No se ha podido guardar la multa. Inténtalo de nuevo.",
    };
  }
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
  // Entrenadores y cuenta con permiso económico.
  if (!(await paymentManager()))
    return { ok: false as const, error: "No autorizado." };
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

// ───────────── Premio "Jugador del Mes": aplicación ─────────────

// Perdona las multas del GANADOR correspondientes al MES GANADO.
// Idempotente: MonthlyAward.monthKey es único, así que no puede aplicarse dos
// veces. No borra multas, no las convierte en pagadas y no altera pagos reales.
export async function applyMonthlyAward(
  monthKey: string,
  confirmPayments = false,
) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  if (!/^\d{4}-\d{2}$/.test(monthKey))
    return { ok: false as const, error: "Mes no válido." };

  const preview = await awardPreview(monthKey);

  if (preview.already)
    return {
      ok: false as const,
      error: "El premio de este mes ya se aplicó anteriormente.",
    };
  if (!preview.monthOver)
    return {
      ok: false as const,
      error: "El mes todavía no ha terminado: aún no hay ganador definitivo.",
    };
  if (!preview.winner)
    return {
      ok: false as const,
      error: "Este mes no tiene un ganador con puntos.",
    };

  // Si hay dinero ya abonado, se exige confirmación expresa: no se inventan
  // reembolsos ni se borran pagos reales.
  if (preview.hasPayments && !confirmPayments)
    return {
      ok: false as const,
      needsPaymentConfirm: true as const,
      error:
        "Alguna multa de ese mes ya tiene importes abonados. Esos pagos NO se devuelven ni se borran: " +
        "solo se perdonará la parte que siga pendiente. Confirma para continuar.",
    };

  const toForgive = preview.fines.filter((f) => f.pending > 0 && !f.forgiven);

  try {
    await prisma.$transaction(async (tx) => {
      for (const f of toForgive) {
        await tx.fine.update({
          where: { id: f.id },
          data: {
            forgiven: true,
            forgivenAt: new Date(),
            forgivenById: s.userId,
            forgivenByName: s.username,
          },
        });
      }
      // El registro con monthKey único garantiza una sola aplicación.
      await tx.monthlyAward.create({
        data: {
          monthKey,
          playerId: preview.winner!.id,
          playerName: preview.winner!.name,
          appliedById: s.userId,
          appliedByName: s.username,
          amountForgiven: toForgive.reduce((a, f) => a + f.pending, 0),
          fineCount: toForgive.length,
          note: preview.hasPayments
            ? "Existían importes ya abonados que no se han modificado."
            : null,
        },
      });
    });

    revalidatePath("/multas");
    revalidatePath("/equipo/jugador-del-mes");
    return { ok: true as const, count: toForgive.length };
  } catch (err) {
    console.error("applyMonthlyAward", monthKey, err);
    return {
      ok: false as const,
      error: "No se ha podido aplicar el premio. Inténtalo de nuevo.",
    };
  }
}
