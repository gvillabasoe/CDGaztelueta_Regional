"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Pencil, Check, X, Loader2 } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { setPlayerPoints, adjustPlayerPoints } from "@/actions/league";

type P = {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  leaguePoints: number;
};

export function LeagueList({
  isCoach,
  players,
}: {
  isCoach: boolean;
  players: P[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  const sorted = [...players].sort(
    (a, b) =>
      b.leaguePoints - a.leaguePoints ||
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
        "es",
      ),
  );

  async function adjust(id: string, delta: number) {
    setBusy(id);
    await adjustPlayerPoints(id, delta);
    setBusy(null);
    router.refresh();
  }
  async function setExact(id: string) {
    setBusy(id);
    await setPlayerPoints(id, parseInt(draft, 10) || 0);
    setBusy(null);
    setEditId(null);
    router.refresh();
  }

  if (sorted.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-gris">
        Todavía no hay jugadores en la plantilla.
      </div>
    );
  }

  // Podio: se calcula a partir de la POSICIÓN ya ordenada (nunca se guarda en
  // la ficha del jugador). El relleno afecta a la FILA COMPLETA y se acompaña
  // de medalla, número de posición y etiqueta de texto.
  const PODIUM = [
    {
      label: "Oro",
      medal: "🥇",
      row: "bg-[#F7E7A6] border border-[#C9A227] shadow-card",
      badge: "bg-[#C9A227] text-[#1A1A1A]",
      text: "text-[#4A3B08]",
    },
    {
      label: "Plata",
      medal: "🥈",
      row: "bg-[#E4E6EA] border border-[#9AA0A6] shadow-card",
      badge: "bg-[#7E848B] text-blanco",
      text: "text-[#2F3337]",
    },
    {
      label: "Bronce",
      medal: "🥉",
      row: "bg-[#EFD9BE] border border-[#B08D57] shadow-card",
      badge: "bg-[#9C7742] text-blanco",
      text: "text-[#4A3520]",
    },
  ];

  return (
    <div className="space-y-2">
      {sorted.map((p, i) => {
        const podium = i < 3 ? PODIUM[i] : null;
        return (
        <div
          key={p.id}
          className={
            "flex items-center gap-3 rounded-2xl p-3 " +
            (podium ? podium.row : "card")
          }
        >
          <div className="flex w-9 shrink-0 flex-col items-center justify-center">
            {podium ? (
              <>
                <span aria-hidden className="text-lg leading-none">
                  {podium.medal}
                </span>
                <span
                  className={
                    "mt-0.5 rounded px-1 text-[10px] font-bold leading-tight " +
                    podium.badge
                  }
                >
                  {i + 1}º
                </span>
                <span className="sr-only">
                  Posición {i + 1}, {podium.label}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gris">{i + 1}</span>
            )}
          </div>
          <PlayerAvatar
            photo={p.photo}
            firstName={p.firstName}
            lastName={p.lastName}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p
              className={
                "truncate font-semibold " + (podium ? podium.text : "text-negro")
              }
            >
              {p.firstName} {p.lastName}
            </p>
            {podium && (
              <p className={"text-[11px] font-bold uppercase " + podium.text}>
                {podium.label}
              </p>
            )}
          </div>

          {isCoach && editId === p.id ? (
            <div className="flex items-center gap-1">
              <input
                className="field w-16 px-2 py-1 text-center"
                inputMode="numeric"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                className="rounded-md p-1.5 text-marino hover:bg-marino/10"
                onClick={() => setExact(p.id)}
                aria-label="Guardar"
              >
                <Check size={16} />
              </button>
              <button
                className="rounded-md p-1.5 text-gris hover:bg-gris/10"
                onClick={() => setEditId(null)}
                aria-label="Cancelar"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {isCoach && (
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gris/30 text-marino hover:bg-beige disabled:opacity-40"
                  onClick={() => adjust(p.id, -1)}
                  disabled={busy === p.id}
                  aria-label="Restar punto"
                >
                  <Minus size={15} />
                </button>
              )}
              <span
                className={
                  "min-w-[3rem] text-right font-display text-xl font-bold " +
                  (podium ? podium.text : "text-marino")
                }
              >
                {busy === p.id ? (
                  <Loader2 size={16} className="inline animate-spin" />
                ) : (
                  p.leaguePoints
                )}
                <span
                  className={
                    "ml-1 text-[11px] font-semibold " +
                    (podium ? podium.text : "text-gris")
                  }
                >
                  pts
                </span>
              </span>
              {isCoach && (
                <>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-gris/30 text-marino hover:bg-beige disabled:opacity-40"
                    onClick={() => adjust(p.id, 1)}
                    disabled={busy === p.id}
                    aria-label="Sumar punto"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    className="rounded-md p-1.5 text-gris hover:bg-gris/10"
                    onClick={() => {
                      setEditId(p.id);
                      setDraft(String(p.leaguePoints));
                    }}
                    aria-label="Fijar puntos"
                  >
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
