import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Diagnóstico de solo lectura del detalle de una actividad: ejecuta por
// separado cada consulta que hace la pantalla e indica cuál falla.
// Solo entrenadores. Uso: /api/diagnostico/actividad  (o ?id=<actividad>)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function step(nombre: string, fn: () => Promise<unknown>) {
  try {
    const r = await fn();
    return [nombre, r === null ? "OK (sin datos)" : "OK"] as const;
  } catch (e) {
    const msg = String(e);
    return [nombre, `FALLA: ${msg.slice(0, 300)}`] as const;
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "COACH")
    return NextResponse.json({ ok: false, error: "Solo entrenadores." }, { status: 403 });

  const url = new URL(req.url);
  let id = url.searchParams.get("id");

  const pasos: Record<string, string> = {};

  // Si no se indica actividad, se toma la más reciente.
  if (!id) {
    const [k, v] = await step("buscar una actividad", async () => {
      const a = await prisma.activity.findFirst({
        orderBy: { date: "desc" },
        select: { id: true, type: true },
      });
      id = a?.id ?? null;
      return a;
    });
    pasos[k] = v;
  }
  if (!id)
    return NextResponse.json({ ok: false, pasos, error: "No hay actividades." });

  // Cada consulta de la pantalla, por separado.
  const checks: [string, () => Promise<unknown>][] = [
    ["actividad (escalares)", () => prisma.activity.findUnique({ where: { id: id as string } })],
    ["plan", () => prisma.activity.findUnique({ where: { id: id as string }, select: { plan: true } })],
    ["ejercicios", () => prisma.exercise.findMany({ where: { activityId: id as string } })],
    ["convocatoria de jugadores", () => prisma.activity.findUnique({ where: { id: id as string }, select: { calledPlayers: { select: { id: true } } } })],
    ["convocatoria de cuerpo técnico", () => prisma.activity.findUnique({ where: { id: id as string }, select: { calledStaff: { select: { id: true } } } })],
    ["asistencia", () => prisma.attendance.findMany({ where: { activityId: id as string } })],
    ["registro de entrenamiento", () => prisma.trainingRecord.findFirst({ where: { activityId: id as string }, select: { id: true } })],
    ["registro de partido", () => prisma.matchRecord.findFirst({ where: { activityId: id as string }, select: { id: true } })],
    ["votación vinculada", () => prisma.poll.findUnique({ where: { activityId: id as string }, select: { id: true } })],
    ["plantilla activa", () => prisma.player.findMany({ where: { status: "ACTIVE" }, select: { id: true } })],
    ["cuerpo técnico", () => prisma.user.findMany({ where: { role: "COACH" }, select: { id: true, displayName: true, nickname: true, photo: true } })],
    ["lecturas de documentos", () => prisma.activityFileView.findMany({ where: { activityId: id as string }, select: { id: true } })],
    ["puntos de liga por ejercicio", () => prisma.leaguePointEntry.findMany({ where: { activityId: id as string }, select: { id: true } })],
    ["consulta completa (como la pantalla)", () =>
      prisma.activity.findUnique({
        where: { id: id as string },
        include: {
          plan: true,
          exercises: { orderBy: { orderIndex: "asc" } },
          calledPlayers: { select: { id: true } },
          attendance: true,
          trainingRecord: { select: { id: true } },
          matchRecord: { select: { id: true } },
        },
      })],
  ];

  for (const [nombre, fn] of checks) {
    const [k, v] = await step(nombre, fn);
    pasos[k] = v;
  }

  const fallos = Object.entries(pasos).filter(([, v]) => v.startsWith("FALLA"));

  return NextResponse.json({
    ok: fallos.length === 0,
    actividad: id,
    resumen: fallos.length
      ? `${fallos.length} consulta(s) fallan. Mira 'pasos'.`
      : "Todas las consultas de la pantalla funcionan.",
    pasos,
  });
}
