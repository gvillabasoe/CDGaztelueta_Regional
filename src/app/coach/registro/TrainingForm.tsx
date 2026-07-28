"use client";

import * as React from "react";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/Switch";
import { FinesEditor } from "./FinesEditor";
import { saveTraining } from "@/actions/training";
import type { FineInput, PlayerLite, TrainingPlayerInput } from "@/lib/types";

function playerName(p: PlayerLite) {
  const base = `${p.firstName} ${p.lastName}`;
  return p.nickname?.trim() ? `${p.nickname} · ${base}` : base;
}

export function TrainingForm({
  players,
  today,
}: {
  players: PlayerLite[];
  today: string;
}) {
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<TrainingPlayerInput[]>(
    players.map((p) => ({
      playerId: p.id,
      attended: true,
      justified: null,
      absenceReason: null,
      grade: null,
      observations: null,
    })),
  );
  const [fines, setFines] = useState<FineInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(i: number, p: Partial<TrainingPlayerInput>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await saveTraining({ date, players: rows, fines });
    setSaving(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError(res.error || "No se ha podido guardar.");
    }
  }

  if (done) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="text-dorado" size={40} />
        <p className="font-display text-xl text-marino">
          Entrenamiento guardado
        </p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setDone(false);
            setRows(
              players.map((p) => ({
                playerId: p.id,
                attended: true,
                justified: null,
                absenceReason: null,
                grade: null,
                observations: null,
              })),
            );
            setFines([]);
            setDate(today);
          }}
        >
          Registrar otro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="card p-4">
        <label className="label" htmlFor="fecha-ent">
          Fecha
        </label>
        <input
          id="fecha-ent"
          type="date"
          className="field"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {players.length === 0 ? (
        <p className="card p-6 text-center text-sm text-gris">
          Crea fichas de jugadores en “Mi Equipo” para poder registrar el
          entrenamiento.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="eyebrow">Jugadores</p>
          {rows.map((row, i) => (
            <div key={row.playerId} className="card space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-marino">
                  {playerName(players[i])}
                </span>
                <label className="flex items-center gap-2 text-xs text-gris">
                  Asistió
                  <Switch
                    checked={row.attended}
                    onChange={(v) =>
                      patch(i, {
                        attended: v,
                        justified: v ? null : row.justified,
                        absenceReason: v ? null : row.absenceReason,
                      })
                    }
                    label="Asistió"
                  />
                </label>
              </div>

              {!row.attended && (
                <div className="space-y-3 rounded-xl bg-beige/50 p-3">
                  <label className="flex items-center justify-between text-sm text-marino">
                    Ausencia justificada
                    <Switch
                      checked={row.justified === true}
                      onChange={(v) => patch(i, { justified: v })}
                      label="Ausencia justificada"
                    />
                  </label>
                  <div>
                    <span className="label">Motivo de la ausencia</span>
                    <input
                      className="field"
                      value={row.absenceReason ?? ""}
                      onChange={(e) =>
                        patch(i, { absenceReason: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[110px_1fr] gap-3">
                <div>
                  <span className="label">Nota (1-10)</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    inputMode="decimal"
                    className="field"
                    value={row.grade ?? ""}
                    onChange={(e) =>
                      patch(i, {
                        grade:
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <span className="label">Observaciones</span>
                  <input
                    className="field"
                    value={row.observations ?? ""}
                    onChange={(e) => patch(i, { observations: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card space-y-3 p-4">
        <p className="eyebrow">Multas</p>
        <FinesEditor players={players} value={fines} onChange={setFines} />
      </div>

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={saving || players.length === 0}
      >
        {saving && <Loader2 size={18} className="animate-spin" />}
        {saving ? "Guardando…" : "Guardar entrenamiento"}
      </button>
    </form>
  );
}
