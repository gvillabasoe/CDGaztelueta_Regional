"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/Switch";
import { FinesAdder } from "../FinesAdder";
import { ABSENCE_REASONS, ABSENCE_LABEL } from "@/lib/labels";
import { saveTraining, updateTraining } from "@/actions/training";
import type {
  NewFineInput,
  PlayerLite,
  SaveTrainingInput,
  TrainingPlayerInput,
} from "@/lib/types";

type RowState = {
  playerId: string;
  name: string;
  attended: boolean;
  justified: boolean;
  reason: string;
  grade: string;
  observations: string;
};

export function TrainingForm({
  activityId,
  mode,
  recordId,
  initialDate,
  players,
  initialPlayers,
}: {
  activityId: string;
  mode: "create" | "edit";
  recordId?: string;
  initialDate: string;
  players: PlayerLite[];
  initialPlayers: TrainingPlayerInput[];
}) {
  const router = useRouter();
  const initMap = new Map(initialPlayers.map((p) => [p.playerId, p]));

  const [date, setDate] = React.useState(initialDate);
  const [rows, setRows] = React.useState<RowState[]>(
    players.map((p) => {
      const r = initMap.get(p.id);
      return {
        playerId: p.id,
        name: `${p.firstName} ${p.lastName}`,
        attended: r ? r.attended : true,
        justified: r?.justified ?? false,
        reason: r?.absenceReason ?? "LESION",
        grade: r?.grade != null ? String(r.grade) : "",
        observations: r?.observations ?? "",
      };
    }),
  );
  const [newFines, setNewFines] = React.useState<NewFineInput[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function patch(id: string, p: Partial<RowState>) {
    setRows((rs) => rs.map((r) => (r.playerId === id ? { ...r, ...p } : r)));
  }

  function parseGrade(s: string): number | null | "bad" {
    if (!s.trim()) return null;
    const v = parseFloat(s.replace(",", "."));
    if (!Number.isFinite(v) || v < 1 || v > 10) return "bad";
    return v;
  }

  async function save() {
    setError(null);
    const players2: TrainingPlayerInput[] = [];
    for (const r of rows) {
      const g = parseGrade(r.grade);
      if (g === "bad") {
        setError(`La nota de ${r.name} debe estar entre 1 y 10.`);
        return;
      }
      players2.push({
        playerId: r.playerId,
        attended: r.attended,
        justified: r.attended ? null : r.justified,
        absenceReason: r.attended ? null : r.reason,
        grade: g,
        observations: r.observations.trim() || null,
      });
    }
    const payload: SaveTrainingInput = {
      activityId,
      date,
      players: players2,
      newFines,
    };
    setSaving(true);
    const res =
      mode === "create"
        ? await saveTraining(payload)
        : await updateTraining(recordId!, payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/planificacion/actividad/${activityId}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <label className="label">Fecha del entrenamiento</label>
        <input
          type="date"
          className="field"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.playerId} className="card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-negro">{r.name}</span>
              <label className="flex items-center gap-2 text-xs text-gris">
                Asistió
                <Switch
                  checked={r.attended}
                  onChange={(v) => patch(r.playerId, { attended: v })}
                  label="Asistió"
                />
              </label>
            </div>

            {!r.attended && (
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-beige/60 p-2">
                <label className="col-span-2 flex items-center justify-between text-xs">
                  Ausencia justificada
                  <Switch
                    checked={r.justified}
                    onChange={(v) => patch(r.playerId, { justified: v })}
                    label="Justificada"
                  />
                </label>
                <div className="col-span-2">
                  <label className="label">Motivo</label>
                  <select
                    className="field"
                    value={r.reason}
                    onChange={(e) => patch(r.playerId, { reason: e.target.value })}
                  >
                    {ABSENCE_REASONS.map((x) => (
                      <option key={x} value={x}>
                        {ABSENCE_LABEL[x]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <label className="label">Nota (1–10)</label>
                <input
                  className="field text-center"
                  inputMode="decimal"
                  placeholder="—"
                  value={r.grade}
                  onChange={(e) => patch(r.playerId, { grade: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Observaciones</label>
                <input
                  className="field"
                  value={r.observations}
                  onChange={(e) =>
                    patch(r.playerId, { observations: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="eyebrow mb-3">Multas (opcional)</p>
        <FinesAdder players={players} onChange={setNewFines} />
      </div>

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}

      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={save} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />} Guardar
          registro
        </button>
        <button
          className="btn-ghost"
          onClick={() => router.push(`/planificacion/actividad/${activityId}`)}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
