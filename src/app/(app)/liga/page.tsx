import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  leagueTableForPeriod,
  leaguePeriods,
  periodResults,
  unassignedLeagueEntries,
} from "@/lib/queries";
import { closeDuePeriods, backfillEntryPeriods } from "@/lib/periods";
import { LeagueList } from "./LeagueList";
import { PeriodHistory } from "./PeriodHistory";

export const dynamic = "force-dynamic";

export default async function LigaPage({
  searchParams,
}: {
  searchParams: { p?: string };
}) {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  // Respaldo del cierre automático: es idempotente, así que entrar aquí no
  // puede reiniciar dos veces ni duplicar historiales.
  await backfillEntryPeriods();
  await closeDuePeriods();

  const periods = await leaguePeriods();
  const openPeriod = periods.find((p) => !p.closed) ?? null;

  // Periodo seleccionado: por defecto, el que está en curso.
  const selected =
    periods.find((p) => p.id === searchParams.p) ?? openPeriod ?? periods[0] ?? null;

  const players = selected ? await leagueTableForPeriod(selected.id) : [];
  const results =
    selected && selected.closed ? await periodResults(selected.id) : [];
  const unassigned = isCoach ? await unassignedLeagueEntries() : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-negro">
          Liga interna
        </h1>
        <p className="mt-0.5 text-sm text-gris">
          Puntos que el entrenador concede por ejercicios, pruebas y objetivos.
          Cada periodo dura dos meses y empieza de cero.
        </p>
      </div>

      {!selected ? (
        <div className="card p-5 text-center text-sm text-gris">
          Todavía no hay ningún periodo de liga abierto. Se abrirá
          automáticamente en septiembre.
        </div>
      ) : (
        <>
          {/* Selector de periodos */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {periods.map((p) => {
              const on = p.id === selected.id;
              return (
                <Link
                  key={p.id}
                  href={`/liga?p=${p.id}`}
                  className={
                    "chip shrink-0 border " +
                    (on
                      ? "border-marino bg-marino text-blanco"
                      : "border-gris/30 bg-blanco text-negro")
                  }
                >
                  {p.name}
                </Link>
              );
            })}
          </div>

          <div className="rounded-xl border border-gris/20 bg-beige/40 px-3 py-2">
            <p className="text-sm font-semibold capitalize text-negro">
              {selected.name}
            </p>
            <p className="text-xs text-gris">
              {selected.closed
                ? "Periodo finalizado · Clasificación definitiva"
                : "Periodo en curso"}
            </p>
          </div>

          {selected.closed ? (
            <PeriodHistory name={selected.name} results={results} />
          ) : (
            <LeagueList isCoach={isCoach} players={players} />
          )}
        </>
      )}

      {isCoach && unassigned > 0 && (
        <div className="rounded-xl border border-gris/25 bg-beige/50 p-3">
          <p className="text-xs text-negro">
            Hay {unassigned}{" "}
            {unassigned === 1
              ? "movimiento de puntos sin periodo asignado"
              : "movimientos de puntos sin periodo asignado"}{" "}
            (su fecha queda fuera de los periodos definidos). Se conservan en el
            historial de cada jugador y no se han añadido al periodo actual.
          </p>
        </div>
      )}

      <Link
        href="/equipo"
        className="card flex items-center justify-between p-3 transition hover:bg-beige/60"
      >
        <span className="text-sm font-medium text-negro">
          Ver la plantilla
        </span>
        <ChevronRight size={18} className="text-gris" />
      </Link>
    </div>
  );
}
