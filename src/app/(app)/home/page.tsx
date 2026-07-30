import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateLong, toDateInputValue } from "@/lib/format";
import { NextMatchCard } from "./NextMatchCard";
import { StandingsSection } from "./StandingsSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  const nm = await prisma.nextMatch.findUnique({ where: { id: 1 } });
  const standings = await prisma.officialStanding.findMany();

  // Preferencia personal de ocultar la clasificación.
  let hideStandings = false;
  if (session) {
    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { hideStandings: true },
    });
    hideStandings = u?.hideStandings ?? false;
  }

  const nmData = {
    matchday: nm?.matchday ?? null,
    date: nm?.date ? toDateInputValue(nm.date) : null,
    time: nm?.time ?? null,
    opponent: nm?.opponent ?? null,
    place: nm?.place ?? null,
    isHome: nm?.isHome ?? true,
  };
  const dateLong = nm?.date ? formatDateLong(nm.date) : null;

  return (
    <div className="space-y-5">
      <NextMatchCard isCoach={isCoach} data={nmData} dateLong={dateLong} />

      <StandingsSection
        isCoach={isCoach}
        initialHidden={hideStandings}
        rows={standings.map((s) => ({
          id: s.id,
          teamName: s.teamName,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          points: s.points,
        }))}
      />
    </div>
  );
}
