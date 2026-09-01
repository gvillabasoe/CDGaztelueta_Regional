import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Diagnóstico de solo lectura: no modifica nada. Sirve para saber por qué una
// cuenta no puede entrar y qué columnas/tablas faltan en la base de datos.
// NUNCA devuelve contraseñas ni hashes. Puedes borrar este archivo cuando ya no lo necesites.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function check(nombre: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return [nombre, "OK"] as const;
  } catch (e) {
    const msg = String(e);
    const corta = msg.length > 180 ? msg.slice(0, 180) + "…" : msg;
    return [nombre, `FALTA / ERROR: ${corta}`] as const;
  }
}

export async function GET() {
  const baseDatos: Record<string, string> = {};

  const pruebas: [string, () => Promise<unknown>][] = [
    ["conexión", () => prisma.user.count()],
    ["User.canVote", () => prisma.user.findFirst({ select: { canVote: true } })],
    ["User.displayName", () => prisma.user.findFirst({ select: { displayName: true } })],
    ["User.email", () => prisma.user.findFirst({ select: { email: true } })],
    [
      "User.canManageFinePayments",
      () => prisma.user.findFirst({ select: { canManageFinePayments: true } }),
    ],
    ["Player.status", () => prisma.player.findFirst({ select: { status: true } })],
    ["Fine.staffUserId", () => prisma.fine.findFirst({ select: { staffUserId: true } })],
    ["Exercise.scorable", () => prisma.exercise.findFirst({ select: { scorable: true } })],
    ["tabla Poll", () => prisma.poll.findFirst({ select: { id: true } })],
    ["tabla Ballot", () => prisma.ballot.findFirst({ select: { id: true } })],
    ["tabla VoteLog", () => prisma.voteLog.findFirst({ select: { id: true } })],
    [
      "tabla LeaguePointEntry",
      () => prisma.leaguePointEntry.findFirst({ select: { id: true } }),
    ],
    [
      "tabla TeamDocument",
      () => prisma.teamDocument.findFirst({ select: { id: true } }),
    ],
  ];

  for (const [nombre, fn] of pruebas) {
    const [k, v] = await check(nombre, fn);
    baseDatos[k] = v;
  }

  // Estado de las cuentas del cuerpo técnico (sin exponer contraseñas)
  const esperadas = [
    { username: "igomeza30", inicial: "mister" },
    { username: "diegozumarraga", inicial: "2mister" },
    { username: "cmattheus", inicial: "3mister" },
  ];

  const cuentas: Record<string, unknown> = {};
  for (const e of esperadas) {
    try {
      const u = await prisma.user.findFirst({
        where: { username: { equals: e.username, mode: "insensitive" } },
        select: { username: true, role: true, password: true },
      });
      if (!u) {
        cuentas[e.username] = { existe: false, nota: "Visita /api/setup para crearla." };
        continue;
      }
      cuentas[e.username] = {
        existe: true,
        usuarioGuardado: u.username,
        rol: u.role,
        contraseñaInicialCoincide: await bcrypt.compare(e.inicial, u.password),
      };
    } catch (err) {
      cuentas[e.username] = { error: String(err) };
    }
  }

  let usuarios: string[] = [];
  try {
    const list = await prisma.user.findMany({
      select: { username: true },
      orderBy: { username: "asc" },
    });
    usuarios = list.map((u) => u.username);
  } catch {
    usuarios = [];
  }

  return NextResponse.json({
    ok: true,
    nota: "Diagnóstico de solo lectura. No modifica datos ni muestra contraseñas.",
    baseDatos,
    cuentas,
    totalUsuarios: usuarios.length,
    usuarios,
  });
}
