"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { normalizeEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { PlayerFichaInput, PlayerEditInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

const clamp0 = (n: number) => Math.max(0, Math.round(Number.isFinite(n) ? n : 0));

// Crea una FICHA deportiva. La cuenta de acceso es OPCIONAL (§2, §5).
export async function createPlayer(input: PlayerFichaInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (!input.firstName.trim() || !input.lastName.trim())
    return { ok: false as const, error: "Nombre y apellidos son obligatorios." };

  const email = normalizeEmail(input.email);
  if (email) {
    const dup = await prisma.player.findFirst({ where: { email } });
    if (dup)
      return {
        ok: false as const,
        error: "Ya existe una ficha con ese correo electrónico.",
      };
  }

  const username = input.username.trim().toLowerCase();
  const wantsAccount = !!username || !!input.password;
  if (wantsAccount && (!username || !input.password))
    return {
      ok: false as const,
      error:
        "Para crear la cuenta indica usuario y contraseña, o deja ambos vacíos.",
    };

  const data: {
    firstName: string;
    lastName: string;
    nickname: string | null;
    number: number | null;
    age: number | null;
    isCaptain: boolean;
    positions: string[];
    photo: string | null;
    email: string | null;
    phone: string | null;
    user?: { create: { username: string; password: string; role: "PLAYER" } };
  } = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    nickname: input.nickname?.trim() || null,
    number: input.number,
    age: input.age,
    isCaptain: input.isCaptain,
    positions: input.positions,
    photo: input.photo || null,
    email: email || null,
    phone: input.phone?.trim() || null,
  };

  if (wantsAccount) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists)
      return { ok: false as const, error: "Ese nombre de usuario ya existe." };
    const hash = await bcrypt.hash(input.password, 10);
    data.user = { create: { username, password: hash, role: "PLAYER" } };
  }

  await prisma.player.create({ data });
  revalidatePath("/equipo");
  revalidatePath("/equipo/gestionar");
  revalidatePath("/liga");
  return { ok: true as const };
}

export async function updatePlayer(id: string, input: PlayerEditInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (!input.firstName.trim() || !input.lastName.trim())
    return { ok: false as const, error: "Nombre y apellidos son obligatorios." };

  const email = normalizeEmail(input.email);
  if (email) {
    const dup = await prisma.player.findFirst({
      where: { email, NOT: { id } },
    });
    if (dup)
      return {
        ok: false as const,
        error: "Ya existe otra ficha con ese correo electrónico.",
      };
  }

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
      email: email || null,
      phone: input.phone?.trim() || null,
      status: input.status,
      callups: clamp0(input.callups),
      minutes: clamp0(input.minutes),
      starts: clamp0(input.starts),
      benchCount: clamp0(input.benchCount),
      goalsCount: clamp0(input.goalsCount),
    },
  });
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
  revalidatePath("/equipo/gestionar");
  revalidatePath("/liga");
  return { ok: true as const };
}
