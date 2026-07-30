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
  playerId: string,
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
  await prisma.attendance.upsert({
    where: { activityId_playerId: { activityId, playerId } },
    create: { activityId, playerId, ...data },
    update: data,
  });
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
  if (!s || s.role !== "PLAYER")
    return { ok: false as const, error: "No autorizado." };
  const player = await prisma.player.findFirst({ where: { userId: s.userId } });
  if (!player)
    return { ok: false as const, error: "No se ha encontrado el jugador." };

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { type: true, date: true },
  });
  if (!activity)
    return { ok: false as const, error: "Actividad no encontrada." };

  if (activity.type === "TRAINING" && isTrainingAttendanceClosed(activity.date))
    return {
      ok: false as const,
      error: "El plazo para modificar la asistencia ha finalizado.",
    };

  return apply(activityId, player.id, status, reason, explanation, {
    byId: s.userId,
    byName: s.username,
    outOfTime: false,
  });
}

// El entrenador puede modificar la asistencia de cualquier jugador en cualquier
// momento; si es un entrenamiento y el plazo ya venció, se marca "fuera de plazo".
export async function setPlayerAttendance(
  activityId: string,
  playerId: string,
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

  return apply(activityId, playerId, status, reason, explanation, {
    byId: s.userId,
    byName: s.username,
    outOfTime,
  });
}
