"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isoWeekToMonday } from "@/lib/week";
import type { PlanInput } from "@/lib/types";

async function guard() {
  const session = await getSession();
  if (!session || session.role !== "COACH") return null;
  return session;
}

function cleanExercises(exs: PlanInput["trainings"][number]["exercises"]) {
  return exs.filter((e) => e.task.trim());
}

export async function savePlan(input: PlanInput) {
  if (!(await guard())) return { ok: false as const, error: "No autorizado." };

  const monday = isoWeekToMonday(input.week);
  if (!monday)
    return { ok: false as const, error: "Selecciona una semana válida." };

  if (input.match.calledPlayerIds.length > 18)
    return {
      ok: false as const,
      error: "La convocatoria no puede superar los 18 jugadores.",
    };

  const clash = await prisma.weeklyPlan.findUnique({
    where: { weekStart: monday },
  });
  if (clash)
    return {
      ok: false as const,
      error: "Ya existe una planificación para esa semana. Edítala desde la lista.",
    };

  const bytes = input.file
    ? Buffer.from(input.file.dataBase64, "base64")
    : undefined;
  const called = input.match.calledPlayerIds.slice(0, 18).map((id) => ({ id }));

  await prisma.weeklyPlan.create({
    data: {
      weekStart: monday,
      fileName: input.file?.name ?? null,
      fileMime: input.file?.mime ?? null,
      fileData: bytes,
      trainings: {
        create: input.trainings.map((t, ti) => ({
          dayOfWeek: t.dayOfWeek,
          time: t.time,
          orderIndex: ti,
          exercises: {
            create: cleanExercises(t.exercises).map((e, ei) => ({
              task: e.task.trim(),
              description: e.description || null,
              objective: e.objective || null,
              duration: e.duration || null,
              orderIndex: ei,
            })),
          },
        })),
      },
      match: {
        create: {
          date: input.match.date ? new Date(input.match.date) : null,
          place: input.match.place || null,
          time: input.match.time || null,
          callTime: input.match.callTime || null,
          kitLocal: input.match.kitLocal,
          calledPlayers: { connect: called },
        },
      },
    },
  });

  revalidatePath("/coach/registro");
  return { ok: true as const };
}

export async function updatePlan(planId: string, input: PlanInput) {
  if (!(await guard())) return { ok: false as const, error: "No autorizado." };

  const monday = isoWeekToMonday(input.week);
  if (!monday)
    return { ok: false as const, error: "Selecciona una semana válida." };

  if (input.match.calledPlayerIds.length > 18)
    return {
      ok: false as const,
      error: "La convocatoria no puede superar los 18 jugadores.",
    };

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
    include: { trainings: { include: { exercises: true } }, match: true },
  });
  if (!current)
    return { ok: false as const, error: "La planificación no existe." };

  const bytes = input.file
    ? Buffer.from(input.file.dataBase64, "base64")
    : undefined;
  const called = input.match.calledPlayerIds.slice(0, 18).map((id) => ({ id }));

  await prisma.$transaction(async (tx) => {
    // 1) Datos del plan (+ archivo si se ha adjuntado uno nuevo)
    await tx.weeklyPlan.update({
      where: { id: planId },
      data: {
        weekStart: monday,
        ...(input.file
          ? {
              fileName: input.file.name,
              fileMime: input.file.mime,
              fileData: bytes,
            }
          : {}),
      },
    });

    // 2) Entrenamientos: eliminar los que se han quitado
    const keepTrainingIds = input.trainings
      .filter((t) => t.id)
      .map((t) => t.id as string);
    const toDeleteTrainings = current.trainings
      .filter((t) => !keepTrainingIds.includes(t.id))
      .map((t) => t.id);
    if (toDeleteTrainings.length) {
      await tx.plannedTraining.deleteMany({
        where: { id: { in: toDeleteTrainings } },
      });
    }

    // 2b) Actualizar existentes / crear nuevos (conservando ids)
    for (let ti = 0; ti < input.trainings.length; ti++) {
      const t = input.trainings[ti];
      const exList = cleanExercises(t.exercises);

      if (t.id) {
        await tx.plannedTraining.update({
          where: { id: t.id },
          data: { dayOfWeek: t.dayOfWeek, time: t.time, orderIndex: ti },
        });

        const currentT = current.trainings.find((x) => x.id === t.id);
        const currentExIds = currentT
          ? currentT.exercises.map((e) => e.id)
          : [];
        const keepExIds = exList.filter((e) => e.id).map((e) => e.id as string);
        const toDeleteEx = currentExIds.filter((id) => !keepExIds.includes(id));
        if (toDeleteEx.length) {
          await tx.exercise.deleteMany({ where: { id: { in: toDeleteEx } } });
        }

        for (let ei = 0; ei < exList.length; ei++) {
          const e = exList[ei];
          const data = {
            task: e.task.trim(),
            description: e.description || null,
            objective: e.objective || null,
            duration: e.duration || null,
            orderIndex: ei,
          };
          if (e.id) {
            await tx.exercise.update({ where: { id: e.id }, data });
          } else {
            await tx.exercise.create({
              data: { trainingId: t.id, ...data },
            });
          }
        }
      } else {
        await tx.plannedTraining.create({
          data: {
            planId,
            dayOfWeek: t.dayOfWeek,
            time: t.time,
            orderIndex: ti,
            exercises: {
              create: exList.map((e, ei) => ({
                task: e.task.trim(),
                description: e.description || null,
                objective: e.objective || null,
                duration: e.duration || null,
                orderIndex: ei,
              })),
            },
          },
        });
      }
    }

    // 3) Ficha del partido (1:1)
    const matchScalar = {
      date: input.match.date ? new Date(input.match.date) : null,
      place: input.match.place || null,
      time: input.match.time || null,
      callTime: input.match.callTime || null,
      kitLocal: input.match.kitLocal,
    };
    if (current.match) {
      await tx.matchPlan.update({
        where: { planId },
        data: { ...matchScalar, calledPlayers: { set: called } },
      });
    } else {
      await tx.matchPlan.create({
        data: { planId, ...matchScalar, calledPlayers: { connect: called } },
      });
    }
  });

  revalidatePath("/coach/registro");
  return { ok: true as const };
}
