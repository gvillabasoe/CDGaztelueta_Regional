"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Standings } from "@/components/Standings";
import { TeamBadge } from "@/components/TeamBadge";
import type { StandingRow, MatchdayView } from "@/lib/standings";

export function LeagueView({
  standings,
  matchdays,
  initialMatchday,
}: {
  standings: StandingRow[];
  matchdays: MatchdayView[];
  initialMatchday: number;
}) {
  const [tab, setTab] = useState<"clasificacion" | "jornadas">("clasificacion");
  const [dayIdx, setDayIdx] = useState(initialMatchday);

  const day = matchdays[dayIdx];

  return (
    <div className="space-y-4">
      {/* Selector de apartado */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-beige p-1">
        <SegBtn
          active={tab === "clasificacion"}
          onClick={() => setTab("clasificacion")}
        >
          Clasificación
        </SegBtn>
        <SegBtn active={tab === "jornadas"} onClick={() => setTab("jornadas")}>
          Jornadas
        </SegBtn>
      </div>

      {tab === "clasificacion" && <Standings rows={standings} />}

      {tab === "jornadas" && (
        <div className="space-y-3">
          {matchdays.length === 0 || !day ? (
            <p className="rounded-xl bg-beige px-4 py-6 text-center text-sm text-gris">
              Todavía no hay jornadas disponibles.
            </p>
          ) : (
            <>
              {/* Navegación de jornadas */}
              <div className="flex items-center justify-between rounded-xl bg-marino px-2 py-2 text-beige">
                <button
                  type="button"
                  onClick={() => setDayIdx((i) => Math.max(0, i - 1))}
                  disabled={dayIdx === 0}
                  aria-label="Jornada anterior"
                  className="rounded-lg p-1.5 disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                  <p className="font-display text-lg font-semibold leading-none">
                    Jornada {day.matchday}
                  </p>
                  {day.matches.some((m) => m.status === "IN_PLAY") && (
                    <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-widest text-amarillo">
                      En juego
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDayIdx((i) => Math.min(matchdays.length - 1, i + 1))
                  }
                  disabled={dayIdx === matchdays.length - 1}
                  aria-label="Jornada siguiente"
                  className="rounded-lg p-1.5 disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Partidos de la jornada */}
              <ul className="space-y-2">
                {day.matches.map((m) => {
                  const played =
                    m.homeGoals !== null && m.awayGoals !== null;
                  return (
                    <li
                      key={m.id}
                      className="rounded-2xl border border-marino/10 bg-blanco p-3"
                    >
                      <div className="mb-1.5 flex items-center justify-between text-[11px] text-gris">
                        <span>
                          {m.dateLabel} · {m.timeLabel}
                        </span>
                        {m.status === "IN_PLAY" && (
                          <span className="font-bold uppercase tracking-wider text-dorado">
                            En juego
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="flex items-center gap-2">
                          <TeamBadge
                            name={m.home.name}
                            isOwn={m.home.isOwn}
                            size={28}
                          />
                          <span
                            className={
                              "truncate text-sm " +
                              (m.home.isOwn ? "font-semibold text-marino" : "")
                            }
                          >
                            {m.home.name}
                          </span>
                        </div>
                        <div className="min-w-[52px] text-center">
                          {played ? (
                            <span className="font-display text-lg font-semibold tabular-nums text-marino">
                              {m.homeGoals} - {m.awayGoals}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gris">
                              vs
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              "truncate text-right text-sm " +
                              (m.away.isOwn ? "font-semibold text-marino" : "")
                            }
                          >
                            {m.away.name}
                          </span>
                          <TeamBadge
                            name={m.away.name}
                            isOwn={m.away.isOwn}
                            size={28}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg py-2 text-sm font-semibold transition " +
        (active ? "bg-marino text-beige shadow-card" : "text-marino/70")
      }
    >
      {children}
    </button>
  );
}
