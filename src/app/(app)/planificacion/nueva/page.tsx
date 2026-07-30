import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { playersLite } from "@/lib/queries";
import { dateToIsoWeek } from "@/lib/week";
import { PlanEditor } from "../PlanEditor";

export const dynamic = "force-dynamic";

export default async function NuevaPlanPage() {
  const session = await getSession();
  if (!session || session.role !== "COACH") redirect("/planificacion");
  const players = await playersLite();

  return (
    <div className="space-y-4">
      <Link
        href="/planificacion"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Planificación
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Crear planificación semanal
      </h1>
      <PlanEditor
        mode="create"
        players={players}
        initialWeek={dateToIsoWeek(new Date())}
      />
    </div>
  );
}
