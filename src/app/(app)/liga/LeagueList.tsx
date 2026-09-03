"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Pencil, Check, X, Loader2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { publicName } from "@/lib/profile";
import { setPlayerPoints, adjustPlayerPoints } from "@/actions/league";

type P = {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  leaguePoints: number;
  nickname?: string | null;
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

  // Zona de Castigo: se calcula SIEMPRE a partir de la posición actual y nunca
  // se guarda en la ficha del jugador. Las posiciones 1-10 usan el diseño
  // normal; desde la 11 hasta la última, fondo rojo claro con etiqueta.
  const PUNISHMENT_FROM = 11;

  return (
    <div className="space-y-2">
      {/* Regla de la Zona de Castigo: informativa, sin efectos económicos */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="flex items-center gap-1.5 text-sm font-bold text-red-800">
          <span aria-hidden>⚠</span> ZONA DE CASTIGO
        </p>
        <p className="mt-1 text-xs leading-relaxed text-negro">
          Los jugadores que terminen cada periodo de dos meses desde la posición
          11 hasta la última deberán invitar al equipo a tortillas y pinchos.
        </p>
      </div>

      {sorted.map((p, i) => {
        const inPunishment = i + 1 >= PUNISHMENT_FROM;
        return (
        <div
          key={p.id}
          className={
            "flex items-center gap-3 rounded-2xl p-3 " +
            (inPunishment
              ? "border border-red-300 bg-red-50 shadow-card"
              : "card")
          }
        >
          <div className="flex w-9 shrink-0 flex-col items-center justify-center">
            <span
              className={
                "text-sm font-bold " +
                (inPunishment ? "text-red-700" : "text-gris")
              }
            >
              {i + 1}
            </span>
            {inPunishment && (
              <span aria-hidden className="text-[13px] leading-none">
                ⚠
              </span>
            )}
          </div>
          <Avatar
            photo={p.photo}
            name={publicName(p.nickname, p.firstName, p.lastName)}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p
              className={
                "truncate font-semibold " +
                (inPunishment ? "text-red-900" : "text-negro")
              }
            >
              {publicName(p.nickname, p.firstName, p.lastName)}
            </p>
            {inPunishment && (
              <p className="text-[11px] font-bold uppercase text-red-700">
                Zona de castigo
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
                  (inPunishment ? "text-red-800" : "text-marino")
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
                    (inPunishment ? "text-red-700" : "text-gris")
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
