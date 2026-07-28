"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Switch } from "@/components/Switch";
import { FinesEditor } from "./FinesEditor";
import { saveTraining, updateTraining } from "@/actions/training";
import type {
  FineInput,
  PlayerLite,
  TrainingPlayerInput,
} from "@/lib/types";

function playerName(p: PlayerLite) {
  const base = `${p.firstName} ${p.lastName}`;
  return p.nickname?.trim() ? `${p.nickname} · ${base}` : base;
}

function buildRows(
  players: PlayerLite[],
  initialPlayers?: TrainingPlayerInput[],
): TrainingPlayerInput[] {
  const byId = new Map(
    (initialPlayers ?? []).map((p) => [p.playerId, p] as const),
  );
  return players.map((p) => {
    const found = byId.get(p.id);
    return found
      ? { ...found }
      : {
          playerId: p.id,
          attended: true,
          justified: null,
          absenceReason: null,
          grade: null,
          observations: null,
        };
  });
}

export function TrainingForm({
  players,
  today,
  mode = "create",
  plannedTrainingId,
  recordId,
  initial,
  contextLabel,
}: {
  players: PlayerLite[];
  today: string;
  mode?: "create" | "edit";
  plannedTrainingId?: string;
  recordId?: string;
  initial?: { date: string; players: TrainingPlayerInput[]; fines: FineInput[] };
  contextLabel?: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? today);
  const [rows, setRows] = useState<TrainingPlayerInput[]>(
    buildRows(players, initial?.players),
  );
  const [fines, setFines] = useState<FineInput[]>(initial?.fines ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(i: number, p: Partial<TrainingPlayerInput>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      date,
      plannedTrainingId: mode === "edit" ? undefined : plannedTrainingId,
      players: rows,
      fines,
    };
    const res =
      mode === "edit" && recordId
        ? await updateTraining(recordId, payload)
        : await saveTraining(payload);
    setSaving(false);
    if (res.ok) {
      router.push("/coach/registro");
      router.refresh();
    } else {
      setError(res.error || "No se ha podido guardar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {contextLabel && (
        <div className="rounded-xl bg-marino px-4 py-3 text-sm text-beige">
          {contextLabel}
        </div>
      )}

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

      <div className="flex gap-3">
        <button
          type="button"
          className="btn-ghost flex-1"
          onClick={() => router.push("/coach/registro")}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={saving || players.length === 0}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
