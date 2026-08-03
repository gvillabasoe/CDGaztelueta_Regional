import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pollById } from "@/lib/queries";
import { VoteForm } from "./VoteForm";

export const dynamic = "force-dynamic";

export default async function VotarPage({
  params,
}: {
  params: { pollId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "PLAYER" && session.role !== "COACH")
    redirect("/equipo/jugador-del-mes");

  const poll = await pollById(params.pollId);
  if (!poll) notFound();

  const now = new Date();
  const accepting = poll.status === "OPEN" && now < poll.closesAt;
  if (!accepting) redirect("/equipo/jugador-del-mes");

  // Elegibilidad: jugador activo con cuenta, o entrenador con permiso de voto.
  let myPlayerId: string | null = null;
  if (session.role === "PLAYER") {
    const me = await prisma.player.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!me) redirect("/equipo/jugador-del-mes");
    myPlayerId = me.id;
  } else {
    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { canVote: true },
    });
    if (!u?.canVote) redirect("/equipo/jugador-del-mes");
  }

  const already = await prisma.ballot.findUnique({
    where: { pollId_voterId: { pollId: poll.id, voterId: session.userId } },
    select: { id: true },
  });
  if (already) redirect("/equipo/jugador-del-mes");

  // Excluir al propio jugador si el voto propio no está permitido (no aplica al entrenador).
  const candidates = poll.candidates
    .filter((c) => poll.allowSelfVote || !myPlayerId || c.id !== myPlayerId)
    .map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      number: c.number,
    }));

  return (
    <div className="space-y-4">
      <Link
        href="/equipo/jugador-del-mes"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Jugador del Mes
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Tu votación
      </h1>
      <p className="text-sm text-gris">
        {poll.activity.opponent
          ? `CD Gaztelueta vs ${poll.activity.opponent}`
          : "Partido"}
      </p>
      <VoteForm pollId={poll.id} candidates={candidates} />
    </div>
  );
}
