import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Icono de la aplicación para la pantalla de inicio (Android e iOS).
// Sirve la versión CUADRADA del escudo generada al subirlo en Configuración.
// Si esa versión no existe todavía, entrega el escudo tal cual y, en último
// caso, el escudo del repositorio. Es una ruta PÚBLICA a propósito: el sistema
// operativo descarga el icono sin sesión al añadir la web al inicio.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { size: string } },
) {
  try {
    const tp = await prisma.teamProfile.findUnique({
      where: { id: 1 },
      select: {
        iconData: true,
        iconMime: true,
        crestData: true,
        crestMime: true,
      },
    });

    const data = tp?.iconData ?? tp?.crestData ?? null;
    const mime = tp?.iconData
      ? tp.iconMime || "image/png"
      : tp?.crestMime || "image/jpeg";

    if (data) {
      const bytes = Buffer.from(data);
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": mime,
          "Content-Length": String(bytes.length),
          // El tamaño pedido queda en la URL; el icono es cuadrado y el
          // sistema lo escala. Se revalida para recoger cambios del escudo.
          "Cache-Control": "public, max-age=3600, must-revalidate",
        },
      });
    }
  } catch (err) {
    console.error("app-icon", params.size, err);
  }

  return NextResponse.redirect(new URL("/escudo.jpg", req.url));
}
