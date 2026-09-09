"use client";

import { Avatar } from "@/components/Avatar";

type Result = {
  playerId: string;
  position: number;
  points: number;
  inPunishment: boolean;
  name: string;
  photo: string | null;
};

// Clasificación FINAL de un periodo cerrado, con su lista definitiva de Zona de
// Castigo. No genera multas ni pagos: es informativa.
export function PeriodHistory({
  name,
  results,
}: {
  name: string;
  results: Result[];
}) {
  const punished = results.filter((r) => r.inPunishment);

  if (results.length === 0)
    return (
      <div className="card p-5 text-center text-sm text-gris">
        Este periodo se cerró sin clasificación guardada.
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.playerId}
            className={
              "flex items-center gap-3 rounded-2xl p-3 " +
              // Se conserva el dato de Zona de Castigo, pero sin fondo rojo.
              (r.position <= 2 ? "border border-gris/25 bg-beige/50" : "card")
            }
          >
            <div className="flex w-9 shrink-0 flex-col items-center">
              <span
                className={
                  "text-sm font-bold text-gris"
                }
              >
                {r.position}
              </span>

            </div>
            <Avatar photo={r.photo} name={r.name} size={40} />
            <div className="min-w-0 flex-1">
              <p
                className={
                  "truncate font-semibold text-negro"
                }
              >
                {r.name}
              </p>
              {r.inPunishment && (
                <p className="text-[11px] font-bold uppercase text-gris">
                  Zona de castigo
                </p>
              )}
            </div>
            <span
              className={
                "font-display text-xl font-bold text-marino"
              }
            >
              {r.points}
              <span className="ml-1 text-[11px] font-semibold text-gris">
                pts
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Aviso final del periodo */}
      <div className="rounded-xl border border-dorado/50 bg-beige/60 p-3">
        <p className="flex items-center gap-1.5 text-sm font-bold text-negro">
          <span aria-hidden>⚠</span> TORTILLAS Y PINCHOS —{" "}
          <span className="uppercase">{name}</span>
        </p>
        {punished.length === 0 ? (
          <p className="mt-1 text-xs text-negro">
            Ningún jugador terminó en Zona de Castigo.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs font-semibold text-negro">
              Jugadores en zona de castigo:
            </p>
            <ul className="mt-1 space-y-0.5">
              {punished.map((r) => (
                <li key={r.playerId} className="text-xs text-negro">
                  · {r.name} ({r.position}º)
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
