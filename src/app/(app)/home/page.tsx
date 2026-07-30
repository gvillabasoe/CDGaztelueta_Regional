import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateLong, toDateInputValue } from "@/lib/format";
import { NextMatchCard } from "./NextMatchCard";
import { StandingsTable } from "./StandingsTable";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  const nm = await prisma.nextMatch.findUnique({ where: { id: 1 } });
  const standings = await prisma.officialStanding.findMany();

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

      <section>
        <h2 className="eyebrow mb-2 px-1">Clasificación oficial</h2>
        <StandingsTable
          isCoach={isCoach}
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
      </section>
    </div>
  );
}
