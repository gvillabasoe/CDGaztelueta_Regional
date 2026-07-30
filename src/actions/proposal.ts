"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { ProposalStatus } from "@/lib/types";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

export async function createProposal(input: { title: string; message: string }) {
  const s = await getSession();
  if (!s || s.role !== "PLAYER")
    return { ok: false as const, error: "No autorizado." };
  const player = await prisma.player.findFirst({ where: { userId: s.userId } });
  if (!player)
    return { ok: false as const, error: "No se ha encontrado el jugador." };
  if (!input.title.trim() || !input.message.trim())
    return { ok: false as const, error: "Añade un título y un mensaje." };
  await prisma.proposal.create({
    data: {
      playerId: player.id,
      title: input.title.trim(),
      message: input.message.trim(),
    },
  });
  revalidatePath("/mas/propuestas");
  return { ok: true as const };
}

export async function respondProposal(
  id: string,
  input: { response: string; status: ProposalStatus },
) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.proposal.update({
    where: { id },
    data: { response: input.response?.trim() || null, status: input.status },
  });
  revalidatePath("/mas/propuestas");
  return { ok: true as const };
}

export async function setProposalStatus(id: string, status: ProposalStatus) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.proposal.update({ where: { id }, data: { status } });
  revalidatePath("/mas/propuestas");
  return { ok: true as const };
}

export async function deleteProposal(id: string) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  await prisma.proposal.delete({ where: { id } });
  revalidatePath("/mas/propuestas");
  return { ok: true as const };
}
