"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { StandingsTable } from "./StandingsTable";
import { setHideStandings } from "@/actions/prefs";

type Row = {
  id: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export function StandingsSection({
  isCoach,
  rows,
  initialHidden,
}: {
  isCoach: boolean;
  rows: Row[];
  initialHidden: boolean;
}) {
  const router = useRouter();
  const [hidden, setHidden] = React.useState(initialHidden);
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    const next = !hidden;
    setBusy(true);
    setHidden(next);
    await setHideStandings(next);
    setBusy(false);
    router.refresh();
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="eyebrow">Clasificación oficial</h2>
        <button
          onClick={toggle}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-medium text-gris transition hover:text-marino"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : hidden ? (
            <Eye size={14} />
          ) : (
            <EyeOff size={14} />
          )}
          {hidden ? "Mostrar clasificación" : "Ocultar clasificación"}
        </button>
      </div>
      {hidden ? (
        <div className="card p-5 text-center text-sm text-gris">
          Has decidido ocultar la clasificación de la liga.
        </div>
      ) : (
        <StandingsTable isCoach={isCoach} rows={rows} />
      )}
    </section>
  );
}
