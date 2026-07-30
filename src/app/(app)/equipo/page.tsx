import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pendingCount } from "@/lib/queries";
import { RosterView } from "./RosterView";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  const players = await prisma.player.findMany({
    where: { status: "ACTIVE" },
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

  const pending = isCoach ? await pendingCount() : 0;

  return (
    <RosterView isCoach={isCoach} players={players} pendingCount={pending} />
  );
}
