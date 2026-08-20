"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { DocKind } from "@/lib/types";

const KINDS: DocKind[] = ["REGIMEN_INTERNO", "GRUPOS_MATERIAL"];

const PATHS: Record<DocKind, string> = {
  REGIMEN_INTERNO: "/mas/regimen-interno",
  GRUPOS_MATERIAL: "/mas/grupos-material",
};

async function coach() {
  const s = await getSession();
  return s && s.role === "COACH" ? s : null;
}

// Sube o sustituye el PDF vigente de una categoría. El documento anterior solo
// se reemplaza cuando la operación termina correctamente.
export async function uploadTeamDocument(
  kind: DocKind,
  file: { name: string; mime: string; dataBase64: string },
) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  if (!KINDS.includes(kind))
    return { ok: false as const, error: "Categoría no válida." };

  // Solo PDF (por tipo declarado o por extensión).
  const isPdf =
    file.mime === "application/pdf" || /\.pdf$/i.test(file.name.trim());
  if (!isPdf)
    return {
      ok: false as const,
      error: "El archivo debe estar en formato PDF. No se ha cambiado el documento.",
    };
  if (!file.dataBase64)
    return { ok: false as const, error: "El archivo está vacío. Inténtalo de nuevo." };

  try {
    const data = Buffer.from(file.dataBase64, "base64");
    if (!data.length)
      return { ok: false as const, error: "El archivo está vacío. Inténtalo de nuevo." };

    await prisma.teamDocument.upsert({
      where: { kind },
      update: {
        fileData: data,
        fileName: file.name.trim() || "documento.pdf",
        fileMime: "application/pdf",
        updatedById: s.userId,
        updatedByName: s.username,
      },
      create: {
        kind,
        fileData: data,
        fileName: file.name.trim() || "documento.pdf",
        fileMime: "application/pdf",
        updatedById: s.userId,
        updatedByName: s.username,
      },
    });
    revalidatePath(PATHS[kind]);
    return { ok: true as const };
  } catch (err) {
    console.error("uploadTeamDocument", kind, err);
    return {
      ok: false as const,
      error: "No se ha podido subir el documento. Inténtalo de nuevo.",
    };
  }
}

// Elimina el PDF vigente de UNA categoría (no afecta a la otra).
export async function deleteTeamDocument(kind: DocKind) {
  const s = await coach();
  if (!s) return { ok: false as const, error: "No autorizado." };
  if (!KINDS.includes(kind))
    return { ok: false as const, error: "Categoría no válida." };
  try {
    await prisma.teamDocument.deleteMany({ where: { kind } });
    revalidatePath(PATHS[kind]);
    return { ok: true as const };
  } catch (err) {
    console.error("deleteTeamDocument", kind, err);
    return {
      ok: false as const,
      error: "No se ha podido eliminar el documento. Inténtalo de nuevo.",
    };
  }
}
