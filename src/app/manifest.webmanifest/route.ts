import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Manifest de la aplicación web (Android/Chrome). Se genera en cada petición
// para tomar el nombre del club y añadir una versión a los iconos, de modo que
// al cambiar el escudo el navegador vuelva a descargarlos.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let name = "CD Gaztelueta";
  let version = "1";
  try {
    const tp = await prisma.teamProfile.findUnique({
      where: { id: 1 },
      select: { name: true, updatedAt: true },
    });
    if (tp?.name) name = tp.name;
    if (tp?.updatedAt) version = String(tp.updatedAt.getTime());
  } catch (err) {
    console.error("manifest", err);
  }

  const icon = (size: number, maskable = false) => ({
    src: `/api/app-icon/${size}?v=${version}${maskable ? "&maskable=1" : ""}`,
    sizes: `${size}x${size}`,
    // Sin "type" a propósito: si todavía no hay icono cuadrado generado se
    // sirve el escudo original, que puede ser JPEG.
    purpose: maskable ? "maskable" : "any",
  });

  return NextResponse.json(
    {
      name,
      short_name: name,
      description: "Seguimiento del equipo — CD Gaztelueta",
      start_url: "/home",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#16233F",
      theme_color: "#16233F",
      lang: "es",
      icons: [
        icon(192),
        icon(512),
        icon(192, true),
        icon(512, true),
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    },
  );
}
