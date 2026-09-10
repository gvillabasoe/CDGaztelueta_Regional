"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isoWeekToMonday } from "@/lib/week";
import type { PlanInput, PlanActivityInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

function scalarOf(a: PlanActivityInput, index: number) {
  const isMatch = a.type === "MATCH";
  const isDinner = a.type === "DINNER";
  return {
    type: a.type,
    date: new Date(a.date),
    startTime: a.startTime || "00:00",
    endTime: isDinner ? null : a.endTime || null,
    // En la cena no se guardan campos deportivos: quedan a null, nunca con
    // valores ficticios como rival "Cena" o resultado "0-0".
    place: isDinner ? null : a.place?.trim() || null,
    opponent: isMatch ? a.opponent?.trim() || null : null,
    matchday: isMatch ? a.matchday : null,
    callTime: isMatch || isDinner ? a.callTime || null : null,
    kitLocal: isMatch ? (a.kitLocal ?? true) : null,
    dinnerPlace: isDinner ? a.dinnerPlace?.trim() || null : null,
    afterPlace: isDinner ? a.afterPlace?.trim() || null : null,
    notes: isDinner ? a.notes?.trim() || null : null,
    pollEnabled: isDinner ? !!a.pollEnabled : false,
    orderIndex: index,
  };
}

function validate(input: PlanInput) {
  if (!isoWeekToMonday(input.week)) return "Selecciona una semana válida.";
  for (const a of input.activities) {
    if (!a.date) return "Cada actividad necesita una fecha.";
    // El máximo de 18 es SOLO de partidos: la cena no lo aplica.
    if (a.type === "MATCH" && a.calledPlayerIds.length > 18)
      return "La convocatoria no puede superar los 18 jugadores.";
    if (a.type === "DINNER") {
      if (!a.startTime && !a.callTime)
        return "La cena necesita una hora de convocatoria.";
      if (!a.dinnerPlace?.trim())
        return "La cena necesita un lugar.";
    }
  }
  return null;
}

export async function savePlan(input: PlanInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const err = validate(input);
  if (err) return { ok: false as const, error: err };
  const monday = isoWeekToMonday(input.week)!;

  const clash = await prisma.weeklyPlan.findUnique({
    where: { weekStart: monday },
  });
  if (clash)
    return {
      ok: false as const,
      error: "Ya existe una planificación para esa semana. Edítala desde la lista.",
    };

  try {
  await prisma.weeklyPlan.create({
    data: {
      weekStart: monday,
      published: input.published,
      activities: {
        create: input.activities.map((a, i) => ({
          ...scalarOf(a, i),
          calledPlayers:
            a.type === "MATCH"
              ? { connect: a.calledPlayerIds.slice(0, 18).map((id) => ({ id })) }
              : a.type === "DINNER" && a.calledPlayerIds.length
                ? { connect: a.calledPlayerIds.map((id) => ({ id })) }
                : undefined,
        })),
      },
    },
  });
  revalidatePath("/planificacion");
  return { ok: true as const };
  } catch (e) {
    console.error("savePlan", e);
    return {
      ok: false as const,
      error: "No se han podido guardar los cambios. Inténtalo de nuevo.",
    };
  }
}

export async function updatePlan(planId: string, input: PlanInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const err = validate(input);
  if (err) return { ok: false as const, error: err };
  const monday = isoWeekToMonday(input.week)!;

  const clash = await prisma.weeklyPlan.findUnique({
    where: { weekStart: monday },
  });
  if (clash && clash.id !== planId)
    return {
      ok: false as const,
      error: "Ya existe otra planificación para esa semana.",
    };

  const current = await prisma.weeklyPlan.findUnique({
    where: { id: planId },
    include: { activities: { select: { id: true } } },
  });
  if (!current)
    return { ok: false as const, error: "La planificación no existe." };

  try {
  await prisma.$transaction(async (tx) => {
    await tx.weeklyPlan.update({
      where: { id: planId },
      data: { weekStart: monday, published: input.published },
    });

    const keep = input.activities.filter((a) => a.id).map((a) => a.id as string);
    const toDelete = current.activities
      .filter((a) => !keep.includes(a.id))
      .map((a) => a.id);
    if (toDelete.length)
      await tx.activity.deleteMany({ where: { id: { in: toDelete } } });

    for (let i = 0; i < input.activities.length; i++) {
      const a = input.activities[i];
      const scalar = scalarOf(a, i);
      // Partido: convocatoria elegida (máx. 18).
      // Cena: TODOS convocados (jugadores activos + cuerpo técnico), sin límite.
      let called: { id: string }[] = [];
      let calledStaff: { id: string }[] = [];
      if (a.type === "MATCH") {
        called = a.calledPlayerIds.slice(0, 18).map((id) => ({ id }));
      } else if (a.type === "DINNER") {
        const ids = a.calledPlayerIds.length
          ? a.calledPlayerIds
          : (
              await tx.player.findMany({
                where: { status: "ACTIVE" },
                select: { id: true },
              })
            ).map((p) => p.id);
        called = [...new Set(ids)].map((id) => ({ id }));
        const staff = await tx.user.findMany({
          where: { role: "COACH" },
          select: { id: true },
        });
        calledStaff = staff.map((u) => ({ id: u.id }));
      }
      if (a.id) {
        await tx.activity.update({
          where: { id: a.id },
          data: {
            ...scalar,
            calledPlayers: { set: called },
            calledStaff: { set: calledStaff },
          },
        });
      } else {
        await tx.activity.create({
          data: {
            planId,
            ...scalar,
            calledPlayers: { connect: called },
            calledStaff: { connect: calledStaff },
          },
        });
      }
    }
  });

  // Los jugadores deben ver los cambios sin reconstruir nada: se revalida la
  // lista y el detalle de cada actividad afectada.
  revalidatePath("/planificacion");
  revalidatePath(`/planificacion/${planId}`);
  for (const a of input.activities)
    if (a.id) revalidatePath(`/planificacion/actividad/${a.id}`);
  return { ok: true as const };
  } catch (e) {
    // Sin excepciones hacia el cliente: error controlado para que el formulario
    // termine su estado de carga, conserve los datos y permita reintentar.
    console.error("updatePlan", planId, e);
    return {
      ok: false as const,
      error: "No se han podido guardar los cambios. Inténtalo de nuevo.",
    };
  }
}

export async function deleteActivity(activityId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.activity.delete({ where: { id: activityId } });
  revalidatePath("/planificacion");
  return { ok: true as const };
}

export async function deletePlan(planId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.weeklyPlan.delete({ where: { id: planId } });
  revalidatePath("/planificacion");
  return { ok: true as const };
}

export async function setPublished(planId: string, published: boolean) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.weeklyPlan.update({ where: { id: planId }, data: { published } });
  revalidatePath("/planificacion");
  return { ok: true as const };
}
