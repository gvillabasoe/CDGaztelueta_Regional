"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { StandingInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

function clean(i: StandingInput) {
  return {
    teamName: i.teamName.trim(),
    played: Math.max(0, Math.round(i.played)),
    won: Math.max(0, Math.round(i.won)),
    drawn: Math.max(0, Math.round(i.drawn)),
    lost: Math.max(0, Math.round(i.lost)),
    goalsFor: Math.max(0, Math.round(i.goalsFor)),
    goalsAgainst: Math.max(0, Math.round(i.goalsAgainst)),
    points: Math.round(i.points),
  };
}

export async function createStanding(input: StandingInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  if (!input.teamName.trim())
    return { ok: false as const, error: "Indica el nombre del equipo." };
  await prisma.officialStanding.create({ data: clean(input) });
  revalidatePath("/home");
  return { ok: true as const };
}

export async function updateStanding(id: string, input: StandingInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.officialStanding.update({ where: { id }, data: clean(input) });
  revalidatePath("/home");
  return { ok: true as const };
}

export async function deleteStanding(id: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.officialStanding.delete({ where: { id } });
  revalidatePath("/home");
  return { ok: true as const };
}
