"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import {
  updateLeaguePointEntry,
  deleteLeaguePointEntry,
} from "@/actions/league";

type E = {
  id: string;
  dateLabel: string;
  exerciseName: string | null;
  points: number;
  note: string | null;
};

const pointsCls = (n: number) =>
  n > 0 ? "text-green-700" : n < 0 ? "text-red-600" : "text-gris";
const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function LeagueHistory({
  total,
  priorBalance,
  entries,
  editable,
}: {
  total: number;
  priorBalance: number;
  entries: E[];
  editable: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [pts, setPts] = React.useState("");
  const [note, setNote] = React.useState("");

  function startEdit(e: E) {
    setEditing(e.id);
    setPts(String(e.points));
    setNote(e.note ?? "");
  }
  async function saveEdit(id: string) {
    setBusy(true);
    await updateLeaguePointEntry(id, parseInt(pts, 10) || 0, note.trim() || null);
    setBusy(false);
    setEditing(null);
    router.refresh();
  }
  async function del(id: string) {
    if (!confirm("¿Eliminar este registro? Se retirarán solo sus puntos."))
      return;
    setBusy(true);
    await deleteLeaguePointEntry(id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">Historial de puntos de Liga</p>
        <span className="font-display text-lg font-bold text-marino">
          {total} pts
        </span>
      </div>

      {entries.length === 0 && priorBalance === 0 ? (
        <p className="text-sm text-gris">Sin movimientos todavía.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded-xl border border-gris/15 p-2.5">
              {editing === e.id ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-negro">
                    {e.exerciseName || "Ajuste manual"} · {e.dateLabel}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      className="field w-20 py-1 text-center"
                      value={pts}
                      onChange={(ev) => setPts(ev.target.value)}
                    />
                    <input
                      className="field flex-1 py-1 text-xs"
                      placeholder="Observación"
                      value={note}
                      onChange={(ev) => setNote(ev.target.value)}
                    />
                    <button
                      onClick={() => saveEdit(e.id)}
                      disabled={busy}
                      className="rounded-lg bg-marino p-1.5 text-blanco disabled:opacity-50"
                      aria-label="Guardar"
                    >
                      {busy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-gris/30 p-1.5 text-gris"
                      aria-label="Cancelar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-negro">
                      {e.exerciseName || "Ajuste manual"}
                    </p>
                    <p className="text-xs text-gris">
                      {e.dateLabel}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <span
                    className={"font-display text-base font-bold " + pointsCls(e.points)}
                  >
                    {fmt(e.points)}
                  </span>
                  {editable && (
                    <span className="flex gap-1">
                      <button
                        onClick={() => startEdit(e)}
                        className="rounded p-1 text-marino hover:bg-marino/10"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => del(e.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}

          {priorBalance !== 0 && (
            <li className="rounded-xl border border-dashed border-gris/30 p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-negro">
                    Ajuste manual anterior
                  </p>
                  <p className="text-xs text-gris">
                    Saldo previo no detallado por ejercicio
                  </p>
                </div>
                <span
                  className={"font-display text-base font-bold " + pointsCls(priorBalance)}
                >
                  {fmt(priorBalance)}
                </span>
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
