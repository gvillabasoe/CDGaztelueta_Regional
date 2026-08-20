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

  try {
    // El entrenamiento debe existir: así el ejercicio queda vinculado a la
    // actividad correcta (y a su planificación a través de ella).
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true },
    });
    if (!activity)
      return {
        ok: false as const,
        error: "No se ha encontrado el entrenamiento. Vuelve a abrirlo e inténtalo de nuevo.",
      };

    const current = await prisma.exercise.findMany({
      where: { activityId },
      select: { id: true },
    });

    // Devuelve los ids en el mismo orden que la lista recibida, de modo que el
    // cliente pueda reutilizarlos si reintenta y no se creen duplicados.
    const savedIds = await prisma.$transaction(async (tx) => {
      const keep = clean.filter((e) => e.id).map((e) => e.id as string);
      const toDelete = current
        .filter((e) => !keep.includes(e.id))
        .map((e) => e.id);
      if (toDelete.length)
        await tx.exercise.deleteMany({ where: { id: { in: toDelete } } });

      const ids: string[] = [];
      for (let i = 0; i < clean.length; i++) {
        const e = clean[i];
        const data = {
          task: e.task.trim(),
          description: e.description?.trim() || null,
          objective: e.objective?.trim() || null,
          duration: e.duration?.trim() || null,
          orderIndex: i,
          scorable: !!e.scorable,
          maxPoints:
            e.maxPoints != null && Number.isFinite(e.maxPoints)
              ? Math.round(e.maxPoints)
              : null,
          scoringInfo: e.scoringInfo?.trim() || null,
        };
        if (e.id) {
          const up = await tx.exercise.update({ where: { id: e.id }, data });
          ids.push(up.id);
        } else {
          const cr = await tx.exercise.create({ data: { activityId, ...data } });
          ids.push(cr.id);
        }
      }
      return ids;
    });

    revalidatePath(`/planificacion/actividad/${activityId}`);
    revalidatePath("/planificacion");
    return { ok: true as const, ids: savedIds };
  } catch (err) {
    // Sin excepciones hacia el cliente: se devuelve un error controlado para que
    // el formulario pueda terminar su estado de carga y permitir el reintento.
    console.error("saveExercises", activityId, err);
    return {
      ok: false as const,
      error: "No se ha podido guardar el ejercicio. Inténtalo de nuevo.",
    };
  }
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

// Documento o imagen específico de un ejercicio (23). Solo el entrenador.
export async function uploadExerciseFile(
  exerciseId: string,
  file: { name: string; mime: string; dataBase64: string },
) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const ex = await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      exFileName: file.name,
      exFileMime: file.mime,
      exFileData: Buffer.from(file.dataBase64, "base64"),
    },
    select: { activityId: true },
  });
  revalidatePath(`/planificacion/actividad/${ex.activityId}`);
  return { ok: true as const };
}

export async function deleteExerciseFile(exerciseId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const ex = await prisma.exercise.update({
    where: { id: exerciseId },
    data: { exFileName: null, exFileMime: null, exFileData: null },
    select: { activityId: true },
  });
  revalidatePath(`/planificacion/actividad/${ex.activityId}`);
  return { ok: true as const };
}
