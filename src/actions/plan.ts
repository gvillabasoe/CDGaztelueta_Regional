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
  return {
    type: a.type,
    date: new Date(a.date),
    startTime: a.startTime || "00:00",
    endTime: a.endTime || null,
    place: a.place?.trim() || null,
    opponent: isMatch ? a.opponent?.trim() || null : null,
    matchday: isMatch ? a.matchday : null,
    callTime: isMatch ? a.callTime || null : null,
    kitLocal: isMatch ? (a.kitLocal ?? true) : null,
    orderIndex: index,
  };
}

function validate(input: PlanInput) {
  if (!isoWeekToMonday(input.week)) return "Selecciona una semana válida.";
  for (const a of input.activities) {
    if (!a.date) return "Cada actividad necesita una fecha.";
    if (a.type === "MATCH" && a.calledPlayerIds.length > 18)
      return "La convocatoria no puede superar los 18 jugadores.";
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
              : undefined,
        })),
      },
    },
  });
  revalidatePath("/planificacion");
  return { ok: true as const };
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
      const called =
        a.type === "MATCH"
          ? a.calledPlayerIds.slice(0, 18).map((id) => ({ id }))
          : [];
      if (a.id) {
        await tx.activity.update({
          where: { id: a.id },
          data: { ...scalar, calledPlayers: { set: called } },
        });
      } else {
        await tx.activity.create({
          data: { planId, ...scalar, calledPlayers: { connect: called } },
        });
      }
    }
  });
  revalidatePath("/planificacion");
  return { ok: true as const };
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
