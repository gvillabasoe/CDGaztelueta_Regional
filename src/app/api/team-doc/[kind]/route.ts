import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const KINDS = ["REGIMEN_INTERNO", "GRUPOS_MATERIAL"] as const;
type Kind = (typeof KINDS)[number];

export async function GET(
  req: Request,
  { params }: { params: { kind: string } },
) {
  // La autorización se comprueba ANTES de entregar el archivo.
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const kind = params.kind as Kind;
  if (!KINDS.includes(kind))
    return new NextResponse("Categoría no válida", { status: 404 });

  const doc = await prisma.teamDocument.findUnique({ where: { kind } });
  if (!doc || !doc.fileData)
    return new NextResponse("Documento no encontrado", { status: 404 });

  const bytes = Buffer.from(doc.fileData);
  const download = new URL(req.url).searchParams.get("download") === "1";
  const disp = download ? "attachment" : "inline";
  const name = encodeURIComponent(doc.fileName || "documento.pdf");

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": doc.fileMime || "application/pdf",
      "Content-Disposition": `${disp}; filename="${name}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
