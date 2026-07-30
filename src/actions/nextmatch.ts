"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { NextMatchInput } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

export async function updateNextMatch(input: NextMatchInput) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const data = {
    matchday: input.matchday,
    date: input.date ? new Date(input.date) : null,
    time: input.time || null,
    opponent: input.opponent?.trim() || null,
    place: input.place?.trim() || null,
    isHome: input.isHome,
  };
  await prisma.nextMatch.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  revalidatePath("/home");
  return { ok: true as const };
}
