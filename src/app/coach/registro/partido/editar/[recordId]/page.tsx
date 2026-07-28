import { redirect } from "next/navigation";
import { MatchForm } from "@/app/coach/registro/MatchForm";
import { getMatchRecordForEdit, getPlayersLite } from "@/lib/planning";
import type { PlayerLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarPartidoPage({
  params,
}: {
  params: { recordId: string };
}) {
  const [record, players] = await Promise.all([
    getMatchRecordForEdit(params.recordId),
    getPlayersLite(),
  ]);
  if (!record) redirect("/coach/registro");

  return (
    <div className="space-y-4">
      <p className="eyebrow">Editar partido</p>
      <MatchForm
        players={players as PlayerLite[]}
        today={record.date}
        mode="edit"
        recordId={params.recordId}
        initial={record}
      />
    </div>
  );
}
