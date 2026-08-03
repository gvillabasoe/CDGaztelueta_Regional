import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Inicialización idempotente: crea o ACTUALIZA los dos entrenadores (fijando su
// contraseña) y la ficha del club, exista lo que exista en la base de datos.
// Solo afecta a esos dos usuarios. Visítala en el navegador tras desplegar.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ficha del club (fila única id=1)
    await prisma.teamProfile.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: "CD Gaztelueta" },
    });

    // Entrenadores: se crean si no existen, o se les fija la contraseña si ya existían.
    const coaches = [
      { username: "igomeza30", password: "mister", canVote: true },
      { username: "diegozumarraga", password: "2mister", canVote: false },
    ];
    for (const c of coaches) {
      const hash = await bcrypt.hash(c.password, 10);
      await prisma.user.upsert({
        where: { username: c.username },
        update: { password: hash, role: "COACH", canVote: c.canVote },
        create: {
          username: c.username,
          password: hash,
          role: "COACH",
          canVote: c.canVote,
        },
      });
    }

    const usuarios = await prisma.user.findMany({
      select: { username: true, role: true },
      orderBy: { username: "asc" },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Entrenadores creados/actualizados. Inicia sesión con igomeza30 / mister (o diegozumarraga / 2mister).",
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
