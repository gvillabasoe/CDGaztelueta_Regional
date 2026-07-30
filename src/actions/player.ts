"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { PlayerFichaInput, PlayerEditInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

const clamp0 = (n: number) => Math.max(0, Math.round(Number.isFinite(n) ? n : 0));

export async function createPlayer(input: PlayerFichaInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const username = input.username.trim().toLowerCase();
  if (!input.firstName.trim() || !input.lastName.trim())
    return { ok: false as const, error: "Nombre y apellidos son obligatorios." };
  if (!username || !input.password)
    return {
      ok: false as const,
      error: "El usuario y la contraseña del jugador son obligatorios.",
    };
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists)
    return { ok: false as const, error: "Ese nombre de usuario ya existe." };

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
          positions: input.positions,
          photo: input.photo || null,
        },
      },
    },
  });
  revalidatePath("/equipo");
  revalidatePath("/liga");
  return { ok: true as const };
}

export async function updatePlayer(id: string, input: PlayerEditInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (!input.firstName.trim() || !input.lastName.trim())
    return { ok: false as const, error: "Nombre y apellidos son obligatorios." };
  await prisma.player.update({
    where: { id },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      nickname: input.nickname?.trim() || null,
      number: input.number,
      age: input.age,
      isCaptain: input.isCaptain,
      positions: input.positions,
      photo: input.photo || null,
      callups: clamp0(input.callups),
      minutes: clamp0(input.minutes),
      starts: clamp0(input.starts),
      benchCount: clamp0(input.benchCount),
      goalsCount: clamp0(input.goalsCount),
    },
  });
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
  revalidatePath("/liga");
  return { ok: true as const };
}
