import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Inicialización única: crea los entrenadores y la ficha del club SOLO si la
// base de datos está vacía. Si ya existen usuarios, no hace nada.
// Visita esta ruta una vez en el navegador tras desplegar con la base de datos vacía.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return NextResponse.json({
        ok: true,
        created: false,
        message:
          "La aplicación ya tenía usuarios. No se ha creado nada. Ya puedes iniciar sesión.",
      });
    }

    // Ficha del club (fila única id=1)
    await prisma.teamProfile.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: "CD Gaztelueta" },
    });

    // Entrenadores (contraseñas cifradas con bcrypt en el servidor)
    const h1 = await bcrypt.hash("mister", 10);
    const h2 = await bcrypt.hash("2mister", 10);
    await prisma.user.createMany({
      data: [
        { username: "igomeza30", password: h1, role: "COACH" },
        { username: "diegozumarraga", password: h2, role: "COACH" },
      ],
    });

    return NextResponse.json({
      ok: true,
      created: true,
      message: "Datos iniciales creados correctamente. Ya puedes iniciar sesión.",
      credenciales: [
        { usuario: "igomeza30", contrasena: "mister" },
        { usuario: "diegozumarraga", contrasena: "2mister" },
      ],
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudieron crear los datos iniciales. Revisa que DATABASE_URL sea correcta y que las tablas existan.",
        error: String(e),
      },
      { status: 500 },
    );
  }
}
