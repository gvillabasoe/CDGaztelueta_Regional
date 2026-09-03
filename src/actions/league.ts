"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { periodIdForDate, currentPeriod } from "@/lib/periods";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

// Fija los puntos del jugador EN EL PERIODO EN CURSO. Se implementa como un
// movimiento por la diferencia, de forma que la clasificación del periodo
// siempre puede reconstruirse desde los movimientos.
export async function setPlayerPoints(playerId: string, points: number) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  try {
    const period = await currentPeriod();
    if (!period)
      return {
        ok: false as const,
        error: "No hay ningún periodo de liga en curso ahora mismo.",
      };

    const agg = await prisma.leaguePointEntry.aggregate({
      where: { playerId, periodId: period.id },
      _sum: { points: true },
    });
    const currentInPeriod = agg._sum.points ?? 0;
    const target = Math.round(points) || 0;
    const delta = target - currentInPeriod;
    if (delta === 0) return { ok: true as const };
    return await adjustPlayerPoints(playerId, delta, "Ajuste manual");
  } catch (err) {
    console.error("setPlayerPoints", err);
    return {
      ok: false as const,
      error: "No se han podido guardar los puntos. Inténtalo de nuevo.",
    };
  }
}

// Suma o resta puntos: crea un movimiento en el periodo en curso y actualiza el
// acumulado histórico del jugador.
export async function adjustPlayerPoints(
  playerId: string,
  delta: number,
  note = "Ajuste manual",
) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  const value = Math.round(delta);
  if (!value) return { ok: true as const };

  try {
    const now = new Date();
    const periodId = await periodIdForDate(now);
    if (!periodId)
      return {
        ok: false as const,
        error: "No hay ningún periodo de liga en curso ahora mismo.",
      };

    await prisma.$transaction(async (tx) => {
      await tx.leaguePointEntry.create({
        data: {
          playerId,
          periodId,
          date: now,
          points: value,
          note,
          coachId: s.userId,
          coachName: s.username,
        },
      });
      await tx.player.update({
        where: { id: playerId },
        data: { leaguePoints: { increment: value } },
      });
    });

    revalidatePath("/liga");
    revalidatePath(`/equipo/${playerId}`);
    return { ok: true as const };
  } catch (err) {
    console.error("adjustPlayerPoints", err);
    return {
      ok: false as const,
      error: "No se han podido guardar los puntos. Inténtalo de nuevo.",
    };
  }
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

  // El periodo se decide por la fecha del entrenamiento, no por la de registro.
  const periodId = await periodIdForDate(ex.activity.date);

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
            periodId,
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
            periodId,
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
