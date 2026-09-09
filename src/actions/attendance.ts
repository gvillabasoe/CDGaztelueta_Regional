"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isTrainingAttendanceClosed } from "@/lib/deadlines";
import { revalidatePath } from "next/cache";

type Status = "GOING" | "NOT_GOING";
type Reason =
  | "LESION"
  | "ENFERMEDAD"
  | "TRABAJO"
  | "ESTUDIOS"
  | "VIAJE"
  | "FAMILIAR"
  | "OTRO";

const REASONS: Reason[] = [
  "LESION",
  "ENFERMEDAD",
  "TRABAJO",
  "ESTUDIOS",
  "VIAJE",
  "FAMILIAR",
  "OTRO",
];

async function apply(
  activityId: string,
  who: { playerId: string } | { staffUserId: string },
  status: Status,
  reason: Reason | null,
  explanation: string | null,
  audit: { byId: string; byName: string; outOfTime: boolean },
) {
  if (status === "NOT_GOING") {
    if (!reason || !REASONS.includes(reason))
      return { ok: false as const, error: "Selecciona un motivo de ausencia." };
    if (!explanation || !explanation.trim())
      return { ok: false as const, error: "Escribe una breve explicación." };
  }
  const base =
    status === "GOING"
      ? { status: "GOING" as const, reason: null, explanation: null }
      : {
          status: "NOT_GOING" as const,
          reason,
          explanation: explanation!.trim(),
        };
  const data = {
    ...base,
    modifiedById: audit.byId,
    modifiedByName: audit.byName,
    modifiedAt: new Date(),
    outOfTime: audit.outOfTime,
  };
  if ("playerId" in who) {
    await prisma.attendance.upsert({
      where: { activityId_playerId: { activityId, playerId: who.playerId } },
      create: { activityId, playerId: who.playerId, ...data },
      update: data,
    });
  } else {
    await prisma.attendance.upsert({
      where: {
        activityId_staffUserId: {
          activityId,
          staffUserId: who.staffUserId,
        },
      },
      create: { activityId, staffUserId: who.staffUserId, ...data },
      update: data,
    });
  }
  revalidatePath(`/planificacion/actividad/${activityId}`);
  revalidatePath("/planificacion");
  return { ok: true as const };
}

// El jugador modifica únicamente su propia asistencia y solo dentro de plazo
// (hasta las 14:00 del día del entrenamiento, hora de servidor).
export async function setMyAttendance(
  activityId: string,
  status: Status,
  reason: Reason | null,
  explanation: string | null,
) {
  const s = await getSession();
  if (!s) return { ok: false as const, error: "No autorizado." };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { type: true, date: true },
  });
  if (!activity)
    return { ok: false as const, error: "Actividad no encontrada." };

  // Cada usuario responde SOLO por sí mismo. En las cenas también responde el
  // cuerpo técnico; el plazo de las 14:00 sigue siendo exclusivo de los
  // entrenamientos (a las cenas no se les impone ninguna hora límite).
  let who: { playerId: string } | { staffUserId: string };
  if (s.role === "PLAYER") {
    const player = await prisma.player.findFirst({
      where: { userId: s.userId },
      select: { id: true },
    });
    if (!player)
      return { ok: false as const, error: "No se ha encontrado el jugador." };
    who = { playerId: player.id };
  } else {
    who = { staffUserId: s.userId };
  }

  if (activity.type === "TRAINING" && isTrainingAttendanceClosed(activity.date))
    return {
      ok: false as const,
      error: "El plazo para modificar la asistencia ha finalizado.",
    };

  return apply(activityId, who, status, reason, explanation, {
    byId: s.userId,
    byName: s.username,
    outOfTime: false,
  });
}

// El entrenador puede modificar la asistencia de cualquier jugador en cualquier
// momento; si es un entrenamiento y el plazo ya venció, se marca "fuera de plazo".
export async function setPlayerAttendance(
  activityId: string,
  memberKey: string, // "p:<playerId>" o "s:<userId>" (también admite un playerId)
  status: Status,
  reason: Reason | null,
  explanation: string | null,
) {
  const s = await getSession();
  if (!s || s.role !== "COACH")
    return { ok: false as const, error: "No autorizado." };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { type: true, date: true },
  });
  if (!activity)
    return { ok: false as const, error: "Actividad no encontrada." };

  const outOfTime =
    activity.type === "TRAINING" && isTrainingAttendanceClosed(activity.date);

  const who = memberKey.startsWith("s:")
    ? { staffUserId: memberKey.slice(2) }
    : { playerId: memberKey.startsWith("p:") ? memberKey.slice(2) : memberKey };

  return apply(activityId, who, status, reason, explanation, {
    byId: s.userId,
    byName: s.username,
    outOfTime,
  });
}
