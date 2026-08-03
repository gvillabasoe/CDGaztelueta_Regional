import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const ex = await prisma.exercise.findUnique({
    where: { id: params.id },
    select: { exFileData: true, exFileName: true, exFileMime: true },
  });
  if (!ex || !ex.exFileData) {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }

  const bytes = Buffer.from(ex.exFileData);
  const download = new URL(req.url).searchParams.get("download") === "1";
  const disp = download ? "attachment" : "inline";
  const name = encodeURIComponent(ex.exFileName || "archivo");

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": ex.exFileMime || "application/octet-stream",
      "Content-Disposition": `${disp}; filename="${name}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
