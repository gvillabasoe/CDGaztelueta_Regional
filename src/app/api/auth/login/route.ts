import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { startSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Introduce usuario y contraseña." },
      { status: 400 },
    );
  }

  try {
    // Se leen SOLO los campos necesarios: así el inicio de sesión no depende de
    // columnas añadidas en versiones posteriores y nunca se rompe por eso.
    const fields = {
      id: true,
      username: true,
      password: true,
      role: true,
    } as const;

    let user = await prisma.user.findUnique({
      where: { username },
      select: fields,
    });

    // Tolerante a mayúsculas/minúsculas (teclados móviles).
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
        select: fields,
      });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 },
      );
    }

    await startSession({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({ role: user.role });
  } catch (err) {
    // Información técnica en los registros; mensaje controlado al usuario.
    console.error("login", err);
    return NextResponse.json(
      {
        error:
          "No se ha podido comprobar el usuario. Vuelve a intentarlo en unos segundos.",
      },
      { status: 500 },
    );
  }
}
