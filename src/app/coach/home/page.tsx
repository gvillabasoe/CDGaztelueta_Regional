import { CalendarDays, Clock } from "lucide-react";
import { Standings } from "@/components/Standings";
import { TeamBadge } from "@/components/TeamBadge";
import {
  getNextMatch,
  getStandings,
  getTeamAverages,
} from "@/lib/standings";
import { formatGrade } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CoachHomePage() {
  const [nextMatch, standings, averages] = await Promise.all([
    getNextMatch(),
    getStandings(),
    getTeamAverages(),
  ]);

  return (
    <div className="space-y-6">
      {/* ── Próximo partido (destacado) ── */}
      <section>
        <p className="eyebrow mb-2">
          {nextMatch?.status === "IN_PLAY" ? "En juego" : "Próximo partido"}
        </p>
        {nextMatch ? (
          <div className="overflow-hidden rounded-3xl bg-marino text-beige shadow-card">
            <div className="flex items-center justify-between px-5 pt-4 text-[11px] uppercase tracking-[0.18em] text-dorado">
              <span>Jornada {nextMatch.matchday}</span>
              <span className="flex items-center gap-1 text-beige/70">
                <CalendarDays size={13} />
                {nextMatch.dateLabel}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <TeamBadge
                  name={nextMatch.home.name}
                  isOwn={nextMatch.home.isOwn}
                  size={56}
                />
                <span className="text-xs font-medium leading-tight">
                  {nextMatch.home.name}
                </span>
              </div>

              <span className="font-display text-2xl font-semibold text-dorado">
                VS
              </span>

              <div className="flex flex-col items-center gap-2 text-center">
                <TeamBadge
                  name={nextMatch.away.name}
                  isOwn={nextMatch.away.isOwn}
                  size={56}
                />
                <span className="text-xs font-medium leading-tight">
                  {nextMatch.away.name}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 border-t border-blanco/10 bg-blanco/[0.03] py-2.5 text-sm text-beige/90">
              <Clock size={14} />
              {nextMatch.timeLabel}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-marino px-5 py-8 text-center text-beige/80">
            No hay ningún partido programado.
          </div>
        )}
      </section>

      {/* ── Notas medias del equipo ── */}
      <section className="grid grid-cols-2 gap-3">
        <AverageCard label="Media entrenamientos" value={averages.training} />
        <AverageCard label="Media partidos" value={averages.match} />
      </section>

      {/* ── Clasificación de la liga ── */}
      <section>
        <p className="eyebrow mb-2">Clasificación de la liga</p>
        <Standings rows={standings} />
      </section>
    </div>
  );
}

function AverageCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-3 py-5 text-center">
      <span className="font-display text-4xl font-semibold text-marino">
        {formatGrade(value)}
      </span>
      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gris">
        {label}
      </span>
    </div>
  );
}
