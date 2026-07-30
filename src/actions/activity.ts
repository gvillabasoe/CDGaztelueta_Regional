"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { ExerciseInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

// Guarda (crea/actualiza/elimina) los ejercicios de una actividad conservando
// los ids existentes para no perder las valoraciones de los jugadores (8.4.2).
export async function saveExercises(activityId: string, list: ExerciseInput[]) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const clean = list.filter((e) => e.task.trim());

  const current = await prisma.exercise.findMany({
    where: { activityId },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    const keep = clean.filter((e) => e.id).map((e) => e.id as string);
    const toDelete = current.filter((e) => !keep.includes(e.id)).map((e) => e.id);
    if (toDelete.length)
      await tx.exercise.deleteMany({ where: { id: { in: toDelete } } });

    for (let i = 0; i < clean.length; i++) {
      const e = clean[i];
      const data = {
        task: e.task.trim(),
        description: e.description?.trim() || null,
        objective: e.objective?.trim() || null,
        duration: e.duration?.trim() || null,
        orderIndex: i,
      };
      if (e.id) {
        await tx.exercise.update({ where: { id: e.id }, data });
      } else {
        await tx.exercise.create({ data: { activityId, ...data } });
      }
    }
  });
  revalidatePath(`/planificacion/actividad/${activityId}`);
  return { ok: true as const };
}

export async function uploadActivityFile(
  activityId: string,
  file: { name: string; mime: string; dataBase64: string },
) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.activity.update({
    where: { id: activityId },
    data: {
      fileName: file.name,
      fileMime: file.mime,
      fileData: Buffer.from(file.dataBase64, "base64"),
    },
  });
  revalidatePath(`/planificacion/actividad/${activityId}`);
  return { ok: true as const };
}

export async function deleteActivityFile(activityId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.activity.update({
    where: { id: activityId },
    data: { fileName: null, fileMime: null, fileData: null },
  });
  revalidatePath(`/planificacion/actividad/${activityId}`);
  return { ok: true as const };
}
