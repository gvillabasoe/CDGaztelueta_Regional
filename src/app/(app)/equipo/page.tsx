import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RosterView } from "./RosterView";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  const players = await prisma.player.findMany({
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      number: true,
      positions: true,
      photo: true,
      isCaptain: true,
    },
  });

  return <RosterView isCoach={isCoach} players={players} />;
}
