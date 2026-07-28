import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const plan = await prisma.weeklyPlan.findUnique({
    where: { id: params.id },
    select: { fileData: true, fileName: true, fileMime: true },
  });

  if (!plan || !plan.fileData) {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }

  const bytes = Buffer.from(plan.fileData);
  const name = encodeURIComponent(plan.fileName || "archivo");

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": plan.fileMime || "application/octet-stream",
      "Content-Disposition": `inline; filename="${name}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
