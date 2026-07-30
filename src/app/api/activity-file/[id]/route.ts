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

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    select: { fileData: true, fileName: true, fileMime: true },
  });
  if (!activity || !activity.fileData) {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }

  const bytes = Buffer.from(activity.fileData);
  const download = new URL(req.url).searchParams.get("download") === "1";
  const disp = download ? "attachment" : "inline";
  const name = encodeURIComponent(activity.fileName || "documento.pdf");

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": activity.fileMime || "application/pdf",
      "Content-Disposition": `${disp}; filename="${name}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
