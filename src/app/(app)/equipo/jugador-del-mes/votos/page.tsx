import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/session";
import { pollsHistory } from "@/lib/queries";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

const MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const monthLabel = (mk: string) => {
  const [y, m] = mk.split("-");
  return `${MES[parseInt(m, 10) - 1]} ${y}`;
};

export default async function HistorialVotosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const polls = await pollsHistory();

  // Agrupado por mes; cada votación reutiliza su partido real.
  const byMonth = new Map<string, typeof polls>();
  for (const p of polls) {
    if (!byMonth.has(p.monthKey)) byMonth.set(p.monthKey, []);
    byMonth.get(p.monthKey)!.push(p);
  }
  const months = [...byMonth.keys()].sort().reverse();

  return (
    <div className="space-y-5">
      <Link
        href="/equipo/jugador-del-mes"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Jugador del Mes
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Historial de votos
      </h1>

      {months.length === 0 ? (
        <div className="card p-5 text-center text-sm text-gris">
          Todavía no hay votaciones.
        </div>
      ) : (
        months.map((mk) => (
          <div key={mk}>
            <h2 className="eyebrow mb-2 px-1 capitalize">{monthLabel(mk)}</h2>
            <div className="space-y-2">
              {byMonth.get(mk)!.map((p) => (
                <Link
                  key={p.id}
                  href={`/equipo/jugador-del-mes/votos/${p.id}`}
                  className="card flex items-center justify-between gap-2 p-3 transition hover:bg-beige/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-negro">
                      {p.activity.matchday != null
                        ? `Jornada ${p.activity.matchday} — `
                        : ""}
                      {p.activity.kitLocal === false && p.activity.opponent
                        ? `${p.activity.opponent} vs CD Gaztelueta`
                        : p.activity.opponent
                          ? `CD Gaztelueta vs ${p.activity.opponent}`
                          : "Partido"}
                    </p>
                    <p className="text-xs text-gris">
                      {formatDateShort(p.activity.date)} ·{" "}
                      {p._count.ballots}{" "}
                      {p._count.ballots === 1 ? "papeleta" : "papeletas"}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-marino">
                    Ver votos <ChevronRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
