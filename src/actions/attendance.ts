"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
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
) {
  if (status === "NOT_GOING") {
    if (!reason || !REASONS.includes(reason))
      return { ok: false as const, error: "Selecciona un motivo de ausencia." };
    if (!explanation || !explanation.trim())
      return { ok: false as const, error: "Escribe una breve explicación." };
  }
  const data =
    status === "GOING"
      ? { status: "GOING" as const, reason: null, explanation: null }
      : {
          status: "NOT_GOING" as const,
          reason,
          explanation: explanation!.trim(),
        };
  await prisma.attendance.upsert({
    where: { activityId_playerId: { activityId, playerId } },
    create: { activityId, playerId, ...data },
    update: data,
  });
  revalidatePath(`/planificacion/actividad/${activityId}`);
  return { ok: true as const };
}

// El jugador modifica únicamente su propia asistencia (8.5).
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
  return apply(activityId, player.id, status, reason, explanation);
}

// El entrenador puede modificar la asistencia de cualquier jugador (8.5).
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
  return apply(activityId, playerId, status, reason, explanation);
}
