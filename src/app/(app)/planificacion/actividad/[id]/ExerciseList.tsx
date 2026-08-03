"use client";

import * as React from "react";
import { Trophy, FileText } from "lucide-react";

export type ExView = {
  id: string;
  task: string;
  description: string | null;
  objective: string | null;
  duration: string | null;
  scorable: boolean;
  maxPoints: number | null;
  scoringInfo: string | null;
  hasFile: boolean;
  fileName: string | null;
};

export function ExerciseList({ exercises }: { exercises: ExView[] }) {
  const [onlyScorable, setOnlyScorable] = React.useState(false);
  const scorableCount = exercises.filter((e) => e.scorable).length;
  const shown = onlyScorable
    ? exercises.filter((e) => e.scorable)
    : exercises;

  if (exercises.length === 0)
    return (
      <p className="text-sm text-gris">Sin ejercicios publicados todavía.</p>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gris">
          Total: {exercises.length} · Puntuables: {scorableCount}
        </p>
        {scorableCount > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => setOnlyScorable(false)}
              className={
                "chip border " +
                (!onlyScorable
                  ? "border-marino bg-marino text-blanco"
                  : "border-gris/30 bg-blanco text-negro")
              }
            >
              Todos
            </button>
            <button
              onClick={() => setOnlyScorable(true)}
              className={
                "chip border " +
                (onlyScorable
                  ? "border-marino bg-marino text-blanco"
                  : "border-gris/30 bg-blanco text-negro")
              }
            >
              Solo puntuables
            </button>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-gris">No hay ejercicios puntuables.</p>
      ) : (
        <ol className="space-y-2">
          {shown.map((e, i) => (
            <li
              key={e.id}
              className={
                "rounded-xl border p-3 " +
                (e.scorable ? "border-dorado bg-dorado/5" : "border-gris/20")
              }
            >
              <p className="flex flex-wrap items-center gap-x-2 font-medium text-negro">
                {e.scorable && <Trophy size={15} className="text-dorado" />}
                <span>
                  {i + 1}. {e.task}
                </span>
                {e.duration ? (
                  <span className="text-xs font-normal text-gris">
                    · {e.duration}
                  </span>
                ) : null}
              </p>

              {e.scorable && (
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-dorado">
                  Ejercicio puntuable para la liga interna
                </p>
              )}

              {e.description && (
                <p className="mt-1 text-sm text-negro/80">{e.description}</p>
              )}
              {e.objective && (
                <p className="mt-1 text-xs text-gris">Objetivo: {e.objective}</p>
              )}
              {e.scorable && e.maxPoints != null && (
                <p className="mt-1 text-xs text-negro">
                  Máximo: {e.maxPoints} puntos
                </p>
              )}
              {e.scorable && e.scoringInfo && (
                <p className="mt-1 whitespace-pre-line rounded-lg bg-beige px-2.5 py-1.5 text-xs text-negro">
                  {e.scoringInfo}
                </p>
              )}
              {e.hasFile && (
                <a
                  href={`/api/exercise-file/${e.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-marino underline"
                >
                  <FileText size={13} />
                  {e.fileName || "Ver archivo"}
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
