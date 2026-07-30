import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { managementPlayers } from "@/lib/queries";
import { GestionarPlantilla } from "./GestionarPlantilla";

export const dynamic = "force-dynamic";

export default async function GestionarPage() {
  const session = await getSession();
  if (!session || session.role !== "COACH") redirect("/equipo");

  const players = await managementPlayers();
  const view = players.map((p) => {
    const c = p._count;
    const hasHistory =
      c.fines +
        c.attendance +
        c.trainingEntries +
        c.matchEntries +
        c.exerciseRatings +
        c.goals >
        0 ||
      p.leaguePoints > 0 ||
      p.callups + p.minutes + p.starts + p.benchCount + p.goalsCount > 0;
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      status: p.status as "ACTIVE" | "INACTIVE" | "PENDING",
      number: p.number,
      hasAccount: !!p.userId,
      account: p.user?.username ?? null,
      email: p.email,
      hasHistory,
    };
  });

  return (
    <div className="space-y-4">
      <Link
        href="/equipo"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Mi Equipo
      </Link>
      <GestionarPlantilla players={view} />
    </div>
  );
}
