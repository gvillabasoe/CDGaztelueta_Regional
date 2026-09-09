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

  // Zonas de la clasificación interna: se calculan SIEMPRE desde la posición
  // actual (nunca se guardan). 1.º verde (Ascenso), 2.º amarillo (Promoción de
  // ascenso) y desde el 3.º hasta el último, fondo normal.
  const ZONE = [
    {
      label: "ASCENSO",
      row: "bg-green-100 border border-green-500 shadow-card",
      text: "text-green-900",
      dot: "bg-green-600",
    },
    {
      label: "PROMOCIÓN DE ASCENSO",
      row: "bg-amarillo/40 border border-dorado shadow-card",
      text: "text-[#4A3B08]",
      dot: "bg-amarillo",
    },
  ];

  return (
    <div className="space-y-2">
      {/* Leyenda: el estado no se comunica solo con color */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl border border-gris/20 bg-beige/40 px-3 py-2 text-[11px] text-negro">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-green-600"
          />
          Ascenso
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-amarillo"
          />
          Promoción de ascenso
        </span>
      </div>

      {sorted.map((p, i) => {
        const zone = i < 2 ? ZONE[i] : null;
        return (
        <div
          key={p.id}
          className={
            "flex items-center gap-3 rounded-2xl p-3 " +
            (zone ? zone.row : "card")
          }
        >
          <div className="flex w-9 shrink-0 flex-col items-center justify-center">
            <span
              className={
                "text-sm font-bold " + (zone ? zone.text : "text-gris")
              }
            >
              {i + 1}
            </span>
            {zone && (
              <span
                aria-hidden
                className={"mt-0.5 h-2 w-2 rounded-full " + zone.dot}
              />
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
                "truncate font-semibold " + (zone ? zone.text : "text-negro")
              }
            >
              {publicName(p.nickname, p.firstName, p.lastName)}
            </p>
            {zone && (
              <p className={"text-[11px] font-bold uppercase " + zone.text}>
                {zone.label}
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
                  (zone ? zone.text : "text-marino")
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
                    (zone ? zone.text : "text-gris")
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
