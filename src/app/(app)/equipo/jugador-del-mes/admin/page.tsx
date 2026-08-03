import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { matchesWithoutPoll, pollAdminData } from "@/lib/queries";
import { formatDateShort, formatDateTime } from "@/lib/format";
import { CreatePoll } from "./CreatePoll";
import { PollAdmin, type PollAdminData } from "./PollAdmin";
import { VotePermissions } from "./VotePermissions";

export const dynamic = "force-dynamic";

export default async function AdminVotacionesPage() {
  const session = await getSession();
  if (!session || session.role !== "COACH") redirect("/equipo/jugador-del-mes");
  const now = new Date();

  const matchesRaw = await matchesWithoutPoll();
  const matches = matchesRaw.map((a) => ({
    id: a.id,
    label: `${a.opponent ? "vs " + a.opponent : "Partido"} · ${formatDateShort(a.date)}`,
    calledIds: a.calledPlayers.map((c) => c.id),
  }));

  const activePlayers = await prisma.player.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, userId: true },
  });
  const players = activePlayers.map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
  }));
  const noAccountPlayers = activePlayers
    .filter((p) => !p.userId)
    .map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}` }));

  const coaches = await prisma.user.findMany({
    where: { role: "COACH" },
    orderBy: { username: "asc" },
    select: { id: true, username: true, canVote: true },
  });

  const polls = await prisma.poll.findMany({
    orderBy: { activity: { date: "desc" } },
    select: { id: true, candidates: { select: { id: true, firstName: true, lastName: true } } },
  });

  const adminData: PollAdminData[] = [];
  for (const p of polls) {
    const d = await pollAdminData(p.id);
    if (!d) continue;
    const effectiveClosed =
      d.poll.status === "CLOSED" || now >= d.poll.closesAt;
    adminData.push({
      pollId: d.poll.id,
      matchLabel: `${d.poll.activity.opponent ? "vs " + d.poll.activity.opponent : "Partido"} · ${formatDateShort(d.poll.activity.date)}`,
      status: d.poll.status as "OPEN" | "CLOSED" | "CANCELLED",
      effectiveClosed,
      closesAtLabel: formatDateTime(d.poll.closesAt),
      monthKey: d.poll.monthKey,
      allowSelfVote: d.poll.allowSelfVote,
      eligibleCount: d.eligibleCount,
      votedCount: d.votedCount,
      voted: d.voted,
      notVoted: d.notVoted,
      onBehalf: d.onBehalf,
      candidates: p.candidates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
      })),
      noAccountPlayers,
    });
  }

  return (
    <div className="space-y-5">
      <Link
        href="/equipo/jugador-del-mes"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Jugador del Mes
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Gestionar votaciones
      </h1>

      <CreatePoll matches={matches} players={players} />

      <VotePermissions coaches={coaches} />

      <div>
        <h2 className="eyebrow mb-2 px-1">Votaciones</h2>
        {adminData.length === 0 ? (
          <div className="card p-5 text-center text-sm text-gris">
            Todavía no hay votaciones.
          </div>
        ) : (
          <div className="space-y-3">
            {adminData.map((d) => (
              <PollAdmin key={d.pollId} data={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
