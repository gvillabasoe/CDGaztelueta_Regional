"use server";

import { prisma } from "@/lib/prisma";
import { registerActivityFileView } from "@/lib/pdfviews";
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

  // Solo PDF: si no lo es, no se toca el documento vigente.
  const isPdf =
    file.mime === "application/pdf" || /\.pdf$/i.test(file.name.trim());
  if (!isPdf)
    return {
      ok: false as const,
      error: "El archivo debe estar en formato PDF. No se ha cambiado el documento.",
    };

  try {
    const data = Buffer.from(file.dataBase64, "base64");
    if (!data.length)
      return { ok: false as const, error: "El archivo está vacío. Inténtalo de nuevo." };

    // La versión sube +1 en la misma operación de guardado: si esto falla, el
    // documento anterior y sus lecturas se conservan intactos y no se genera
    // ningún aviso falso.
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        fileData: data,
        fileName: file.name.trim() || "documento.pdf",
        fileMime: "application/pdf",
        fileVersion: { increment: 1 },
      },
    });

    revalidatePath(`/planificacion/actividad/${activityId}`);
    revalidatePath("/planificacion");
    return { ok: true as const };
  } catch (err) {
    console.error("uploadActivityFile", activityId, err);
    return {
      ok: false as const,
      error: "No se ha podido subir el documento. Inténtalo de nuevo.",
    };
  }
}

export async function deleteActivityFile(activityId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  try {
    await prisma.activity.update({
      where: { id: activityId },
      data: { fileData: null, fileName: null, fileMime: null },
    });
    revalidatePath(`/planificacion/actividad/${activityId}`);
    revalidatePath("/planificacion");
    return { ok: true as const };
  } catch (err) {
    console.error("deleteActivityFile", activityId, err);
    return {
      ok: false as const,
      error: "No se ha podido eliminar el documento. Inténtalo de nuevo.",
    };
  }
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

// Marca el PDF general como consultado por el USUARIO AUTENTICADO.
// El identificador nunca se acepta del cliente: se toma de la sesión.
export async function markActivityFileViewed(activityId: string) {
  const s = await getSession();
  if (!s) return { ok: false as const, error: "No autorizado." };
  const done = await registerActivityFileView(s.userId, activityId);
  if (!done)
    return { ok: false as const, error: "El documento no está disponible." };
  revalidatePath("/planificacion");
  revalidatePath(`/planificacion/actividad/${activityId}`);
  return { ok: true as const };
}
