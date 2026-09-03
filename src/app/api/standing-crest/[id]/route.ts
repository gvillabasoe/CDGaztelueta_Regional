import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const row = await prisma.officialStanding.findUnique({
    where: { id: params.id },
    select: { crestData: true, crestMime: true },
  });
  if (!row || !row.crestData)
    return new NextResponse("Sin imagen", { status: 404 });

  const bytes = Buffer.from(row.crestData);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": row.crestMime || "image/png",
      "Content-Length": String(bytes.length),
      "Cache-Control": "no-store",
    },
  });
}
