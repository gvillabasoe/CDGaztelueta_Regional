import type { StandingRow } from "@/lib/standings";

export function Standings({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-beige px-4 py-6 text-center text-sm text-gris">
        Todavía no hay clasificación disponible.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-marino/10 bg-blanco">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-marino text-beige">
            <th className="px-2 py-2 text-left font-semibold">#</th>
            <th className="px-2 py-2 text-left font-semibold">Equipo</th>
            <th className="w-8 px-1 py-2 text-center font-semibold">PJ</th>
            <th className="w-8 px-1 py-2 text-center font-semibold">DG</th>
            <th className="w-9 px-1 py-2 text-center font-semibold">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.teamId}
              className={
                "border-t border-marino/5 " +
                (r.isOwn ? "bg-dorado/15 font-semibold" : "")
              }
            >
              <td className="px-2 py-2 text-left tabular-nums text-gris">
                {i + 1}
              </td>
              <td className="px-2 py-2 text-left">
                <span className="flex items-center gap-2">
                  {r.isOwn && (
                    <span className="h-4 w-1 rounded-full bg-dorado" />
                  )}
                  <span className="truncate">{r.name}</span>
                </span>
              </td>
              <td className="px-1 py-2 text-center tabular-nums">{r.played}</td>
              <td className="px-1 py-2 text-center tabular-nums">
                {r.gd > 0 ? `+${r.gd}` : r.gd}
              </td>
              <td className="px-1 py-2 text-center font-display text-base font-semibold tabular-nums text-marino">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-marino/5 px-3 py-2 text-[11px] text-gris">
        PJ: partidos jugados · DG: diferencia de goles · PTS: puntos
      </p>
    </div>
  );
}
