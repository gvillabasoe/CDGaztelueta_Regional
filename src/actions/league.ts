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

import type { AssignEntry } from "@/lib/types";

function refreshLeague(playerId?: string, activityId?: string) {
  revalidatePath("/liga");
  revalidatePath("/equipo");
  if (playerId) revalidatePath(`/equipo/${playerId}`);
  if (activityId) revalidatePath(`/planificacion/actividad/${activityId}`);
}

// Asigna puntos de LIGA desde un ejercicio puntuable (27-29). Idempotente por
// (ejercicio, jugador): reasigna ajustando por la diferencia, nunca duplica.
export async function assignExercisePoints(
  exerciseId: string,
  entries: AssignEntry[],
) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };

  const ex = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: {
      task: true,
      scorable: true,
      activityId: true,
      activity: { select: { date: true } },
    },
  });
  if (!ex) return { ok: false as const, error: "Ejercicio no encontrado." };
  if (!ex.scorable)
    return { ok: false as const, error: "El ejercicio no es puntuable." };

  const valid = entries.filter(
    (e) => e.playerId && Number.isFinite(e.points),
  );

  await prisma.$transaction(async (tx) => {
    for (const e of valid) {
      const points = Math.round(e.points);
      const existing = await tx.leaguePointEntry.findUnique({
        where: { exerciseId_playerId: { exerciseId, playerId: e.playerId } },
      });
      if (existing) {
        const delta = points - existing.points;
        await tx.leaguePointEntry.update({
          where: { id: existing.id },
          data: {
            points,
            note: e.note?.trim() || null,
            date: ex.activity.date,
            exerciseName: ex.task,
            activityId: ex.activityId,
            coachId: s.userId,
            coachName: s.username,
          },
        });
        if (delta !== 0)
          await tx.player.update({
            where: { id: e.playerId },
            data: { leaguePoints: { increment: delta } },
          });
      } else {
        await tx.leaguePointEntry.create({
          data: {
            playerId: e.playerId,
            exerciseId,
            activityId: ex.activityId,
            exerciseName: ex.task,
            date: ex.activity.date,
            points,
            note: e.note?.trim() || null,
            coachId: s.userId,
            coachName: s.username,
          },
        });
        if (points !== 0)
          await tx.player.update({
            where: { id: e.playerId },
            data: { leaguePoints: { increment: points } },
          });
      }
    }
  });

  refreshLeague(undefined, ex.activityId);
  return { ok: true as const };
}

// Editar una entrada del historial (ajusta el total por la diferencia).
export async function updateLeaguePointEntry(
  entryId: string,
  points: number,
  note: string | null,
) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  const entry = await prisma.leaguePointEntry.findUnique({
    where: { id: entryId },
    select: { points: true, playerId: true, activityId: true },
  });
  if (!entry) return { ok: false as const, error: "Registro no encontrado." };
  const val = Math.round(points);
  const delta = val - entry.points;
  await prisma.$transaction(async (tx) => {
    await tx.leaguePointEntry.update({
      where: { id: entryId },
      data: { points: val, note: note?.trim() || null },
    });
    if (delta !== 0)
      await tx.player.update({
        where: { id: entry.playerId },
        data: { leaguePoints: { increment: delta } },
      });
  });
  refreshLeague(entry.playerId, entry.activityId ?? undefined);
  return { ok: true as const };
}

// Eliminar una entrada: retira SOLO sus puntos del total.
export async function deleteLeaguePointEntry(entryId: string) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  const entry = await prisma.leaguePointEntry.findUnique({
    where: { id: entryId },
    select: { points: true, playerId: true, activityId: true },
  });
  if (!entry) return { ok: false as const, error: "Registro no encontrado." };
  await prisma.$transaction(async (tx) => {
    await tx.leaguePointEntry.delete({ where: { id: entryId } });
    if (entry.points !== 0)
      await tx.player.update({
        where: { id: entry.playerId },
        data: { leaguePoints: { increment: -entry.points } },
      });
  });
  refreshLeague(entry.playerId, entry.activityId ?? undefined);
  return { ok: true as const };
}
