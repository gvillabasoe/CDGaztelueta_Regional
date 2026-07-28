"use client";

import { Plus, Trash2 } from "lucide-react";
import type { FineInput, PlayerLite } from "@/lib/types";

function playerName(p: PlayerLite) {
  return p.nickname?.trim() || `${p.firstName} ${p.lastName}`;
}

export function FinesEditor({
  players,
  value,
  onChange,
}: {
  players: PlayerLite[];
  value: FineInput[];
  onChange: (v: FineInput[]) => void;
}) {
  function update(i: number, patch: Partial<FineInput>) {
    onChange(value.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function add() {
    onChange([...value, { playerIds: [], amount: 0, reason: "" }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function togglePlayer(i: number, id: string) {
    const f = value[i];
    const has = f.playerIds.includes(id);
    update(i, {
      playerIds: has
        ? f.playerIds.filter((p) => p !== id)
        : [...f.playerIds, id],
    });
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-gris">No hay multas registradas.</p>
      )}

      {value.map((fine, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-gris/20 bg-beige/40 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gris">
              Multa {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-lg p-1.5 text-gris hover:bg-blanco hover:text-marino"
              aria-label="Eliminar multa"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div>
            <span className="label">Jugadores</span>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const selected = fine.playerIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(i, p.id)}
                    className={
                      "chip border transition " +
                      (selected
                        ? "border-marino bg-marino text-beige"
                        : "border-gris/30 bg-blanco text-marino")
                    }
                  >
                    {playerName(p)}
                  </button>
                );
              })}
              {players.length === 0 && (
                <span className="text-sm text-gris">
                  Aún no hay jugadores.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">Cantidad (€)</span>
              <input
                type="number"
                min="0"
                step="0.5"
                inputMode="decimal"
                className="field"
                value={fine.amount || ""}
                onChange={(e) =>
                  update(i, { amount: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <span className="label">Motivo</span>
              <input
                className="field"
                value={fine.reason}
                onChange={(e) => update(i, { reason: e.target.value })}
                placeholder="Motivo de la multa"
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={add} className="btn-ghost w-full">
        <Plus size={16} /> Añadir multa
      </button>
    </div>
  );
}
