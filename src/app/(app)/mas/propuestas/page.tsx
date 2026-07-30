import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { currentPlayer } from "@/lib/queries";
import { formatDateLong } from "@/lib/format";
import { PropuestasView } from "./PropuestasView";
import type { ProposalStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PropuestasPage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";
  const me = isCoach ? null : await currentPlayer();

  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      player: { select: { firstName: true, lastName: true } },
    },
  });

  const view = proposals.map((p) => ({
    id: p.id,
    authorName: `${p.player.firstName} ${p.player.lastName}`,
    dateLong: formatDateLong(p.createdAt),
    title: p.title,
    message: p.message,
    response: p.response,
    status: p.status as ProposalStatus,
  }));

  return (
    <PropuestasView
      isCoach={isCoach}
      isPlayer={!!me}
      proposals={view}
    />
  );
}
