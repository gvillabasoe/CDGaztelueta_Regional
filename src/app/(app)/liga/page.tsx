import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LeagueList } from "./LeagueList";

export const dynamic = "force-dynamic";

export default async function LigaPage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  const players = await prisma.player.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      leaguePoints: true,
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-negro">
          Liga interna
        </h1>
        <p className="mt-0.5 text-sm text-gris">
          Puntos que el entrenador concede por ejercicios, pruebas y objetivos.
        </p>
      </div>
      <LeagueList isCoach={isCoach} players={players} />
    </div>
  );
}
