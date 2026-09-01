import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";

// Inicialización idempotente del cuerpo técnico y de la ficha del club.
// CADA PASO ES INDEPENDIENTE: si uno falla, los demás se ejecutan igualmente y
// el resultado se informa paso a paso. Así un fallo suelto nunca impide crear
// las cuentas de acceso.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FINANCE_EMAIL = "iurzaye@gmail.com";

const COACHES = [
  { username: "igomeza30", password: "mister", displayName: null as string | null },
  { username: "diegozumarraga", password: "2mister", displayName: null as string | null },
  { username: "cmattheus", password: "3mister", displayName: "Carlos Mattheus" },
];

export async function GET() {
  const pasos: Record<string, string> = {};

  // 1) Ficha del club (aislada: no debe bloquear la creación de cuentas)
  try {
    await prisma.teamProfile.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: "CD Gaztelueta" },
    });
    pasos.fichaClub = "OK";
  } catch (e) {
    pasos.fichaClub = `FALLO (no impide crear cuentas): ${String(e)}`;
  }

  // 2) Cuentas del cuerpo técnico: lo imprescindible para poder entrar
  for (const c of COACHES) {
    const clave = `cuenta_${c.username}`;
    try {
      const hash = await bcrypt.hash(c.password, 10);
      const existing = await prisma.user.findFirst({
        where: { username: { equals: c.username, mode: "insensitive" } },
        select: { id: true, username: true },
      });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { password: hash, role: "COACH" },
        });
        pasos[clave] = `OK (ya existía como "${existing.username}", contraseña restablecida)`;
      } else {
        await prisma.user.create({
          data: { username: c.username, password: hash, role: "COACH" },
        });
        pasos[clave] = "OK (creada)";
      }
    } catch (e) {
      pasos[clave] = `FALLO: ${String(e)}`;
    }
  }

  // 3) Extras del rol (voto y nombre visible): no afectan al acceso
  for (const c of COACHES) {
    const clave = `extras_${c.username}`;
    try {
      const u = await prisma.user.findFirst({
        where: { username: { equals: c.username, mode: "insensitive" } },
        select: { id: true },
      });
      if (!u) {
        pasos[clave] = "OMITIDO (la cuenta no existe)";
        continue;
      }
      await prisma.user.update({
        where: { id: u.id },
        data: {
          canVote: true,
          ...(c.displayName ? { displayName: c.displayName } : {}),
        },
      });
      pasos[clave] = "OK";
    } catch (e) {
      pasos[clave] =
        `FALLO: faltan columnas nuevas en la base de datos (canVote/displayName). ` +
        `La cuenta SÍ puede iniciar sesión. Ejecuta "prisma db push". Detalle: ${String(e)}`;
    }
  }

  // 4) Permiso económico por correo normalizado
  try {
    const target = normalizeEmail(FINANCE_EMAIL);
    const candidates = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        player: { select: { email: true } },
      },
    });
    const match = candidates.find(
      (u) =>
        normalizeEmail(u.email) === target ||
        normalizeEmail(u.username) === target ||
        normalizeEmail(u.player?.email) === target,
    );
    if (match) {
      await prisma.user.update({
        where: { id: match.id },
        data: { canManageFinePayments: true, email: target },
      });
      pasos.permisoEconomico = `OK: asignado a la cuenta "${match.username}".`;
    } else {
      pasos.permisoEconomico =
        `NO se ha encontrado ninguna cuenta con el correo ${FINANCE_EMAIL}. ` +
        "Cuando esa persona cree su cuenta con ese correo, vuelve a visitar /api/setup. " +
        "No se ha concedido el permiso a nadie más.";
    }
  } catch (e) {
    pasos.permisoEconomico = `FALLO (faltan columnas nuevas): ${String(e)}`;
  }

  // 5) Listado final de usuarios
  let usuarios: { username: string; role: string }[] = [];
  try {
    usuarios = await prisma.user.findMany({
      select: { username: true, role: true },
      orderBy: { username: "asc" },
    });
    pasos.listadoUsuarios = "OK";
  } catch (e) {
    pasos.listadoUsuarios = `FALLO: ${String(e)}`;
  }

  const cuentasOk = COACHES.every((c) =>
    (pasos[`cuenta_${c.username}`] ?? "").startsWith("OK"),
  );

  return NextResponse.json({
    ok: cuentasOk,
    message: cuentasOk
      ? "Cuentas del cuerpo técnico listas: igomeza30, diegozumarraga y cmattheus (rol Entrenador)."
      : "Alguna cuenta NO se ha podido crear. Mira el detalle en 'pasos'.",
    pasos,
    totalUsuarios: usuarios.length,
    usuarios,
  });
}
