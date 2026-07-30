"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Preferencia personal (por cuenta) para ocultar la clasificación oficial en HOME.
export async function setHideStandings(hide: boolean) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "No autenticado." };
  await prisma.user.update({
    where: { id: session.userId },
    data: { hideStandings: hide },
  });
  revalidatePath("/home");
  return { ok: true as const };
}
