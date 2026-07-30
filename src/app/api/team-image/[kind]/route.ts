import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function image(data: Buffer, mime: string | null) {
  return new NextResponse(data, {
    headers: {
      "Content-Type": mime || "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: { kind: string } },
) {
  const tp = await prisma.teamProfile.findUnique({ where: { id: 1 } });

  if (params.kind === "crest") {
    if (tp?.crestData) return image(Buffer.from(tp.crestData), tp.crestMime);
    return NextResponse.redirect(new URL("/escudo.jpg", req.url));
  }
  if (params.kind === "photo") {
    if (tp?.photoData) return image(Buffer.from(tp.photoData), tp.photoMime);
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse("No encontrado", { status: 404 });
}
