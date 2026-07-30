"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

export async function updateTeamProfile(input: {
  name: string;
  info: string | null;
}) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const data = {
    name: input.name.trim() || "CD Gaztelueta",
    info: input.info?.trim() || null,
  };
  await prisma.teamProfile.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  revalidatePath("/mas/config");
  revalidatePath("/home");
  revalidatePath("/login");
  return { ok: true as const };
}

export async function setTeamImage(
  kind: "crest" | "photo",
  file: { mime: string; dataBase64: string } | null,
) {
  if (!(await coach())) return { ok: false as const, error: "No autorizado." };
  const bytes = file ? Buffer.from(file.dataBase64, "base64") : null;
  const data =
    kind === "crest"
      ? { crestData: bytes, crestMime: file?.mime ?? null }
      : { photoData: bytes, photoMime: file?.mime ?? null };
  await prisma.teamProfile.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/home");
  revalidatePath("/mas/config");
  return { ok: true as const };
}
