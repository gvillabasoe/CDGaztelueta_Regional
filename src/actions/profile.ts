"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Edición del PROPIO perfil: foto y mote. El usuario se toma SIEMPRE de la
// sesión, así que nadie puede modificar el perfil de otra persona ni mediante
// una llamada directa. El nombre y los apellidos reales no se tocan.
export async function updateMyProfile(input: {
  nickname: string | null;
  photo: string | null; // data URL, o null para volver al avatar por defecto
}) {
  const s = await getSession();
  if (!s) return { ok: false as const, error: "No autorizado." };

  const nickname = (input.nickname ?? "").trim() || null;
  const photo = input.photo && input.photo.startsWith("data:image")
    ? input.photo
    : input.photo === null
      ? null
      : undefined; // valor no válido: no se toca la foto

  if (photo === undefined && input.photo !== null)
    return {
      ok: false as const,
      error: "La imagen no es válida. Prueba con otra fotografía.",
    };

  try {
    if (s.role === "PLAYER") {
      const me = await prisma.player.findFirst({
        where: { userId: s.userId },
        select: { id: true },
      });
      if (!me) return { ok: false as const, error: "No tienes ficha asociada." };
      await prisma.player.update({
        where: { id: me.id },
        data: { nickname, photo: photo ?? null },
      });
      revalidatePath(`/equipo/${me.id}`);
    } else {
      // Cuerpo técnico: el perfil público vive en su cuenta.
      await prisma.user.update({
        where: { id: s.userId },
        data: { nickname, photo: photo ?? null },
      });
    }

    // El cambio se propaga a todas las zonas que leen el perfil público.
    revalidatePath("/mas/perfil");
    revalidatePath("/equipo");
    revalidatePath("/liga");
    revalidatePath("/equipo/jugador-del-mes");
    return { ok: true as const };
  } catch (err) {
    console.error("updateMyProfile", err);
    return {
      ok: false as const,
      error: "No se han podido guardar los cambios. Inténtalo de nuevo.",
    };
  }
}
