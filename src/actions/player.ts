"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { CreatePlayerInput } from "@/lib/types";

export async function createPlayer(input: CreatePlayerInput) {
  const session = await getSession();
  if (!session || session.role !== "COACH") {
    return { ok: false as const, error: "No autorizado." };
  }

  const username = input.username.trim();
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { ok: false as const, error: "El nombre y los apellidos son obligatorios." };
  }
  if (!username || !input.password) {
    return {
      ok: false as const,
      error: "El usuario y la contraseña del jugador son obligatorios.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { ok: false as const, error: "Ese usuario ya existe. Elige otro." };
  }

  const positions = input.positions
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const hash = await bcrypt.hash(input.password, 10);

  await prisma.user.create({
    data: {
      username,
      password: hash,
      role: "PLAYER",
      player: {
        create: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          nickname: input.nickname?.trim() || null,
          number: input.number,
          age: input.age,
          isCaptain: input.isCaptain,
          positions,
          photo: input.photo || null,
        },
      },
    },
  });

  revalidatePath("/coach/equipo");
  return { ok: true as const };
}
