import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";

// Inicialización idempotente: crea o ACTUALIZA los entrenadores del cuerpo
// técnico (fijando su contraseña) y la ficha del club, y asigna el permiso
// económico a la cuenta indicada si existe. Visítala en el navegador tras desplegar.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Correo de la cuenta que debe recibir el permiso económico (no se inventa contraseña).
const FINANCE_EMAIL = "iurzaye@gmail.com";

export async function GET() {
  try {
    // Ficha del club (fila única id=1)
    await prisma.teamProfile.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: "CD Gaztelueta" },
    });

    // Cuerpo técnico. Los tres tienen el MISMO rol (COACH) y, por tanto, los
    // mismos permisos administrativos: no hay entrenador "secundario".
    const coaches = [
      { username: "igomeza30", password: "mister", displayName: null as string | null },
      { username: "diegozumarraga", password: "2mister", displayName: null as string | null },
      { username: "cmattheus", password: "3mister", displayName: "Carlos Mattheus" },
    ];

    for (const c of coaches) {
      const hash = await bcrypt.hash(c.password, 10);
      const existing = await prisma.user.findUnique({
        where: { username: c.username },
        select: { id: true, displayName: true },
      });
      if (existing) {
        // No se crea una segunda cuenta: se actualiza la existente.
        await prisma.user.update({
          where: { username: c.username },
          data: {
            password: hash,
            role: "COACH",
            canVote: true, // los tres pueden votar en Jugador del Mes
            displayName: c.displayName ?? existing.displayName,
          },
        });
      } else {
        await prisma.user.create({
          data: {
            username: c.username,
            password: hash,
            role: "COACH",
            canVote: true,
            displayName: c.displayName,
          },
        });
      }
    }

    // ── Permiso económico (independiente del rol) ──
    // Se busca la cuenta por correo NORMALIZADO (sin espacios, sin distinguir
    // mayúsculas): en User.email, en el nombre de usuario (el autorregistro usa
    // el correo como usuario) o en el correo de la ficha vinculada.
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

    let permisoEconomico: string;
    if (match) {
      await prisma.user.update({
        where: { id: match.id },
        data: { canManageFinePayments: true, email: target },
      });
      permisoEconomico = `Permiso de gestión de pagos asignado a la cuenta "${match.username}".`;
    } else {
      permisoEconomico =
        `NO se ha encontrado ninguna cuenta con el correo ${FINANCE_EMAIL}. ` +
        "El permiso está implementado y listo: cuando esa persona cree su cuenta " +
        "con ese correo, vuelve a visitar /api/setup y se le asignará. " +
        "No se ha concedido el permiso a ningún otro usuario.";
    }

    const usuarios = await prisma.user.findMany({
      select: {
        username: true,
        displayName: true,
        role: true,
        canVote: true,
        canManageFinePayments: true,
      },
      orderBy: { username: "asc" },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Cuerpo técnico creado/actualizado: igomeza30, diegozumarraga y cmattheus (rol Entrenador, mismos permisos).",
      permisoEconomico,
      totalUsuarios: usuarios.length,
      usuarios,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Error al inicializar. Revisa DATABASE_URL (mismo entorno que la app) y que las tablas existan.",
        error: String(e),
      },
      { status: 500 },
    );
  }
}
