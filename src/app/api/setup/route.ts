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

    // Se crea la cuenta en DOS pasos aislados: primero lo imprescindible para
    // poder iniciar sesión (usuario, contraseña, rol) y después los campos
    // añadidos en versiones posteriores. Así, si alguna columna nueva todavía no
    // existe en la base de datos, la cuenta se crea igualmente y se informa.
    const avisos: string[] = [];

    for (const c of coaches) {
      const hash = await bcrypt.hash(c.password, 10);
      try {
        const existing = await prisma.user.findUnique({
          where: { username: c.username },
          select: { id: true },
        });
        if (existing) {
          // Nunca se crea una segunda cuenta: se actualiza la existente.
          await prisma.user.update({
            where: { username: c.username },
            data: { password: hash, role: "COACH" },
          });
        } else {
          await prisma.user.create({
            data: { username: c.username, password: hash, role: "COACH" },
          });
        }
      } catch (e) {
        avisos.push(`No se pudo crear/actualizar ${c.username}: ${String(e)}`);
        continue;
      }

      // Extras (permiso de voto y nombre visible): no bloquean el acceso.
      try {
        await prisma.user.update({
          where: { username: c.username },
          data: {
            canVote: true,
            ...(c.displayName ? { displayName: c.displayName } : {}),
          },
        });
      } catch (e) {
        avisos.push(
          `${c.username}: cuenta lista, pero faltan columnas nuevas (canVote/displayName). Ejecuta "prisma db push". Detalle: ${String(e)}`,
        );
      }
    }

    // ── Permiso económico (independiente del rol) ──
    // Se busca la cuenta por correo NORMALIZADO (sin espacios, sin distinguir
    // mayúsculas): en User.email, en el nombre de usuario (el autorregistro usa
    // el correo como usuario) o en el correo de la ficha vinculada.
    const target = normalizeEmail(FINANCE_EMAIL);
    let permisoEconomico = "";
    try {
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
      permisoEconomico = `Permiso de gestión de pagos asignado a la cuenta "${match.username}".`;
    } else {
      permisoEconomico =
        `NO se ha encontrado ninguna cuenta con el correo ${FINANCE_EMAIL}. ` +
        "El permiso está implementado y listo: cuando esa persona cree su cuenta " +
        "con ese correo, vuelve a visitar /api/setup y se le asignará. " +
        "No se ha concedido el permiso a ningún otro usuario.";
    }
    } catch (e) {
      permisoEconomico =
        "No se pudo comprobar el permiso económico (faltan columnas nuevas). " +
        'Ejecuta "prisma db push" y vuelve a visitar /api/setup. Detalle: ' +
        String(e);
    }

    let usuarios: { username: string; role: string }[] = [];
    try {
      usuarios = await prisma.user.findMany({
        select: { username: true, role: true },
        orderBy: { username: "asc" },
      });
    } catch (e) {
      avisos.push(`No se pudo listar usuarios: ${String(e)}`);
    }

    return NextResponse.json({
      ok: true,
      message:
        "Cuerpo técnico creado/actualizado: igomeza30, diegozumarraga y cmattheus (rol Entrenador, mismos permisos).",
      permisoEconomico,
      avisos,
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
