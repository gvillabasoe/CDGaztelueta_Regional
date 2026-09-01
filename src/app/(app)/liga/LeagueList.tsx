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

  // Podio: se calcula a partir de la POSICIÓN ya ordenada (nunca se guarda).
  // Además del color se usan medalla, número de posición y etiqueta de texto.
  const PODIUM = [
    {
      label: "Oro",
      medal: "🥇",
      card: "bg-[#C9A227]/12 ring-1 ring-[#C9A227]",
      badge: "bg-[#C9A227] text-negro",
    },
    {
      label: "Plata",
      medal: "🥈",
      card: "bg-[#A8A9AD]/15 ring-1 ring-[#8E9095]",
      badge: "bg-[#8E9095] text-blanco",
    },
    {
      label: "Bronce",
      medal: "🥉",
      card: "bg-[#B08D57]/12 ring-1 ring-[#B08D57]",
      badge: "bg-[#B08D57] text-blanco",
    },
  ];

  return (
    <div className="space-y-2">
      {sorted.map((p, i) => {
        const podium = i < 3 ? PODIUM[i] : null;
        return (
        <div
          key={p.id}
          className={"card flex items-center gap-3 p-3 " + (podium ? podium.card : "")}
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
            <p className="truncate font-medium text-negro">
              {p.firstName} {p.lastName}
            </p>
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
              <span className="min-w-[3rem] text-right font-display text-xl font-bold text-marino">
                {busy === p.id ? (
                  <Loader2 size={16} className="inline animate-spin" />
                ) : (
                  p.leaguePoints
                )}
                <span className="ml-1 text-[11px] font-semibold text-gris">
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
