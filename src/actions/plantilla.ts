"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { normalizeEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { PlayerStatus } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

function refresh() {
  revalidatePath("/equipo");
  revalidatePath("/equipo/gestionar");
  revalidatePath("/liga");
  revalidatePath("/multas");
}

const STATUSES: PlayerStatus[] = ["ACTIVE", "INACTIVE", "PENDING"];

// Cambiar estado: activar, dar de baja (inactivo) o marcar pendiente.
export async function setPlayerStatus(id: string, status: PlayerStatus) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (!STATUSES.includes(status))
    return { ok: false as const, error: "Estado no válido." };
  await prisma.player.update({ where: { id }, data: { status } });
  refresh();
  return { ok: true as const };
}

// ¿Tiene historial que proteger antes de eliminar?
async function hasHistory(id: string) {
  const p = await prisma.player.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          fines: true,
          attendance: true,
          trainingEntries: true,
          matchEntries: true,
          exerciseRatings: true,
          goals: true,
        },
      },
    },
  });
  if (!p) return false;
  const c = p._count;
  return (
    c.fines +
      c.attendance +
      c.trainingEntries +
      c.matchEntries +
      c.exerciseRatings +
      c.goals >
      0 ||
    p.leaguePoints > 0 ||
    p.callups + p.minutes + p.starts + p.benchCount + p.goalsCount > 0
  );
}

// Eliminar ficha. Con historial exige confirmación explícita (force).
export async function deletePlayer(id: string, force = false) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const history = await hasHistory(id);
  if (history && !force)
    return {
      ok: false as const,
      needsConfirm: true as const,
      error:
        "Esta ficha tiene historial (estadísticas, multas, asistencias o registros). " +
        "Lo recomendable es darla de baja. Si aun así quieres eliminarla, confirma para borrar también su historial.",
    };

  // Borra primero las relaciones no-cascada; el resto se elimina en cascada.
  await prisma.$transaction([
    prisma.trainingPlayer.deleteMany({ where: { playerId: id } }),
    prisma.matchGoal.deleteMany({ where: { playerId: id } }),
    prisma.matchCard.deleteMany({ where: { playerId: id } }),
    prisma.matchPlayer.deleteMany({ where: { playerId: id } }),
    prisma.substitution.deleteMany({
      where: { OR: [{ playerOutId: id }, { playerInId: id }] },
    }),
    prisma.player.delete({ where: { id } }),
  ]);
  refresh();
  return { ok: true as const };
}

// Desvincular la cuenta de acceso de una ficha (la ficha permanece).
export async function unlinkAccount(id: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.player.update({ where: { id }, data: { userId: null } });
  refresh();
  return { ok: true as const };
}

export async function changePlayerEmail(id: string, email: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const norm = normalizeEmail(email);
  if (norm) {
    const dup = await prisma.player.findFirst({
      where: { email: norm, NOT: { id } },
    });
    if (dup)
      return { ok: false as const, error: "Otra ficha ya usa ese correo." };
  }
  await prisma.player.update({ where: { id }, data: { email: norm || null } });
  refresh();
  return { ok: true as const };
}

// Fusiona dos fichas duplicadas en una principal (keepId), conservando todo.
export async function mergePlayers(keepId: string, mergeId: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (keepId === mergeId)
    return { ok: false as const, error: "Selecciona dos fichas distintas." };

  const keep = await prisma.player.findUnique({ where: { id: keepId } });
  const merge = await prisma.player.findUnique({ where: { id: mergeId } });
  if (!keep || !merge)
    return { ok: false as const, error: "Ficha no encontrada." };

  await prisma.$transaction(async (tx) => {
    // 1) Sumar estadísticas y puntos.
    await tx.player.update({
      where: { id: keepId },
      data: {
        callups: keep.callups + merge.callups,
        minutes: keep.minutes + merge.minutes,
        starts: keep.starts + merge.starts,
        benchCount: keep.benchCount + merge.benchCount,
        goalsCount: keep.goalsCount + merge.goalsCount,
        leaguePoints: keep.leaguePoints + merge.leaguePoints,
        email: keep.email ?? merge.email,
        phone: keep.phone ?? merge.phone,
        number: keep.number ?? merge.number,
        nickname: keep.nickname ?? merge.nickname,
        photo: keep.photo ?? merge.photo,
      },
    });

    // 2) Relaciones sin restricción de unicidad: reasignar directamente.
    await tx.fine.updateMany({
      where: { playerId: mergeId },
      data: { playerId: keepId },
    });
    await tx.proposal.updateMany({
      where: { playerId: mergeId },
      data: { playerId: keepId },
    });
    await tx.matchGoal.updateMany({
      where: { playerId: mergeId },
      data: { playerId: keepId },
    });
    await tx.matchCard.updateMany({
      where: { playerId: mergeId },
      data: { playerId: keepId },
    });
    await tx.substitution.updateMany({
      where: { playerOutId: mergeId },
      data: { playerOutId: keepId },
    });
    await tx.substitution.updateMany({
      where: { playerInId: mergeId },
      data: { playerInId: keepId },
    });

    // Votos recibidos en papeletas de "Jugador del Mes".
    await tx.ballot.updateMany({
      where: { firstId: mergeId },
      data: { firstId: keepId },
    });
    await tx.ballot.updateMany({
      where: { secondId: mergeId },
      data: { secondId: keepId },
    });
    await tx.ballot.updateMany({
      where: { thirdId: mergeId },
      data: { thirdId: keepId },
    });

    // Historial de puntos de LIGA: mover; si colisiona por (ejercicio, jugador),
    // sumar los puntos al registro de keep y descartar el duplicado.
    const keepEntries = await tx.leaguePointEntry.findMany({
      where: { playerId: keepId, exerciseId: { not: null } },
      select: { id: true, exerciseId: true },
    });
    const keepByEx = new Map(keepEntries.map((e) => [e.exerciseId, e.id]));
    const mergeEntries = await tx.leaguePointEntry.findMany({
      where: { playerId: mergeId },
      select: { id: true, exerciseId: true, points: true },
    });
    for (const e of mergeEntries) {
      const dest = e.exerciseId ? keepByEx.get(e.exerciseId) : undefined;
      if (dest) {
        await tx.leaguePointEntry.update({
          where: { id: dest },
          data: { points: { increment: e.points } },
        });
        await tx.leaguePointEntry.delete({ where: { id: e.id } });
      } else {
        await tx.leaguePointEntry.update({
          where: { id: e.id },
          data: { playerId: keepId },
        });
      }
    }

    // 3) Relaciones con @@unique(x, playerId): mover si no colisiona; si no, descartar la duplicada.
    const moveUnique = async (
      rows: { id: string; key: string }[],
      keepKeys: Set<string>,
      del: (id: string) => Promise<unknown>,
      upd: (id: string) => Promise<unknown>,
    ) => {
      for (const r of rows) {
        if (keepKeys.has(r.key)) await del(r.id);
        else await upd(r.id);
      }
    };

    // Asistencias (clave: activityId)
    const keepAtt = new Set(
      (
        await tx.attendance.findMany({
          where: { playerId: keepId },
          select: { activityId: true },
        })
      ).map((a) => a.activityId),
    );
    const mergeAtt = await tx.attendance.findMany({
      where: { playerId: mergeId },
      select: { id: true, activityId: true },
    });
    await moveUnique(
      mergeAtt.map((a) => ({ id: a.id, key: a.activityId })),
      keepAtt,
      (id) => tx.attendance.delete({ where: { id } }),
      (id) => tx.attendance.update({ where: { id }, data: { playerId: keepId } }),
    );

    // Valoraciones de ejercicios (clave: exerciseId)
    const keepRat = new Set(
      (
        await tx.exerciseRating.findMany({
          where: { playerId: keepId },
          select: { exerciseId: true },
        })
      ).map((r) => r.exerciseId),
    );
    const mergeRat = await tx.exerciseRating.findMany({
      where: { playerId: mergeId },
      select: { id: true, exerciseId: true },
    });
    await moveUnique(
      mergeRat.map((r) => ({ id: r.id, key: r.exerciseId })),
      keepRat,
      (id) => tx.exerciseRating.delete({ where: { id } }),
      (id) =>
        tx.exerciseRating.update({ where: { id }, data: { playerId: keepId } }),
    );

    // Registros de entrenamiento (clave: recordId)
    const keepTp = new Set(
      (
        await tx.trainingPlayer.findMany({
          where: { playerId: keepId },
          select: { recordId: true },
        })
      ).map((r) => r.recordId),
    );
    const mergeTp = await tx.trainingPlayer.findMany({
      where: { playerId: mergeId },
      select: { id: true, recordId: true },
    });
    await moveUnique(
      mergeTp.map((r) => ({ id: r.id, key: r.recordId })),
      keepTp,
      (id) => tx.trainingPlayer.delete({ where: { id } }),
      (id) =>
        tx.trainingPlayer.update({ where: { id }, data: { playerId: keepId } }),
    );

    // Registros de partido (clave: recordId)
    const keepMp = new Set(
      (
        await tx.matchPlayer.findMany({
          where: { playerId: keepId },
          select: { recordId: true },
        })
      ).map((r) => r.recordId),
    );
    const mergeMp = await tx.matchPlayer.findMany({
      where: { playerId: mergeId },
      select: { id: true, recordId: true },
    });
    await moveUnique(
      mergeMp.map((r) => ({ id: r.id, key: r.recordId })),
      keepMp,
      (id) => tx.matchPlayer.delete({ where: { id } }),
      (id) =>
        tx.matchPlayer.update({ where: { id }, data: { playerId: keepId } }),
    );

    // 4) Convocatorias (M–N): conectar en keep las actividades de merge.
    const mergeCalled = await tx.player.findUnique({
      where: { id: mergeId },
      select: { calledFor: { select: { id: true } } },
    });
    if (mergeCalled && mergeCalled.calledFor.length) {
      await tx.player.update({
        where: { id: keepId },
        data: {
          calledFor: {
            connect: mergeCalled.calledFor.map((a) => ({ id: a.id })),
          },
        },
      });
    }

    // 5) Cuenta de acceso: si keep no tiene y merge sí, trasladarla.
    if (!keep.userId && merge.userId) {
      await tx.player.update({
        where: { id: mergeId },
        data: { userId: null },
      });
      await tx.player.update({
        where: { id: keepId },
        data: { userId: merge.userId },
      });
    }

    // 6) Eliminar la ficha fusionada (sus join M–N se limpian solos).
    await tx.player.delete({ where: { id: mergeId } });
  });

  refresh();
  return { ok: true as const };
}
