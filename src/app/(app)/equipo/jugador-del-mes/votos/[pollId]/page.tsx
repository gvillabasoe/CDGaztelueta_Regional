import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { pollById, publicBallots } from "@/lib/queries";
import { formatDateLong, formatDateTimeShort } from "@/lib/format";
import { PublicVotes } from "../../PublicVotes";

export const dynamic = "force-dynamic";

export default async function VotosPartidoPage({
  params,
}: {
  params: { pollId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const poll = await pollById(params.pollId);
  if (!poll) notFound();

  const raw = await publicBallots(poll.id);
  const ballots = raw.map((b) => ({
    id: b.id,
    voterName: b.voterName,
    voterPhoto: b.voterPhoto,
    onBehalf: b.onBehalf,
    dateLabel: formatDateTimeShort(b.createdAt),
    first: { name: b.first.name, photo: b.first.photo },
    second: { name: b.second.name, photo: b.second.photo },
    third: { name: b.third.name, photo: b.third.photo },
  }));

  return (
    <div className="space-y-4">
      <Link
        href="/equipo/jugador-del-mes/votos"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Historial de votos
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold text-negro">
          Votos del partido
        </h1>
        <p className="mt-1 text-sm text-gris">
          {poll.activity.matchday != null
            ? `Jornada ${poll.activity.matchday} · `
            : ""}
          {poll.activity.opponent
            ? `CD Gaztelueta vs ${poll.activity.opponent}`
            : "Partido"}{" "}
          · {formatDateLong(poll.activity.date)}
        </p>
      </div>
      <div className="card p-4">
        <PublicVotes ballots={ballots} />
      </div>
    </div>
  );
}
