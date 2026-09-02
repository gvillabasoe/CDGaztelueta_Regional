import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { myFinesSummary, hasPendingPdf } from "@/lib/queries";
import { AppShell } from "@/components/AppShell";
import { AccountNotice } from "./AccountNotice";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Un jugador solo accede como activo si su ficha está ACTIVE (§7.2).
  if (session.role === "PLAYER") {
    const player = await prisma.player.findFirst({
      where: { userId: session.userId },
      select: { status: true },
    });
    if (!player || player.status !== "ACTIVE") {
      return (
        <AccountNotice status={player?.status === "INACTIVE" ? "INACTIVE" : "PENDING"} />
      );
    }
  }

  const roleLabel = session.role === "COACH" ? "Entrenador" : "Jugador";
  // Aviso personal de multas: se calcula desde la deuda real del usuario.
  const mine = await myFinesSummary();
  // Aviso de PLANIFICACIÓN: documentos nuevos sin consultar (independiente).
  const pdfPending = await hasPendingPdf();
  return (
    <AppShell
      roleLabel={roleLabel}
      fineDebt={mine.hasDebt}
      planPending={pdfPending}
    >
      {children}
    </AppShell>
  );
}
