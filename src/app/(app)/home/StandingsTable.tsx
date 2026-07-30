"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  createStanding,
  updateStanding,
  deleteStanding,
} from "@/actions/standings";

type Row = {
  id: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

const blank = {
  teamName: "",
  played: "0",
  won: "0",
  drawn: "0",
  lost: "0",
  goalsFor: "0",
  goalsAgainst: "0",
  points: "0",
};
type Draft = typeof blank;

const n = (s: string) => {
  const v = parseInt(s, 10);
  return Number.isFinite(v) ? v : 0;
};

export function StandingsTable({
  isCoach,
  rows,
}: {
  isCoach: boolean;
  rows: Row[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(blank);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const sorted = [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      a.teamName.localeCompare(b.teamName, "es"),
  );

  function startAdd() {
    setDraft(blank);
    setAdding(true);
    setEditingId(null);
    setError(null);
  }
  function startEdit(r: Row) {
    setDraft({
      teamName: r.teamName,
      played: String(r.played),
      won: String(r.won),
      drawn: String(r.drawn),
      lost: String(r.lost),
      goalsFor: String(r.goalsFor),
      goalsAgainst: String(r.goalsAgainst),
      points: String(r.points),
    });
    setEditingId(r.id);
    setAdding(false);
    setError(null);
  }
  function cancel() {
    setAdding(false);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const payload = {
      teamName: draft.teamName,
      played: n(draft.played),
      won: n(draft.won),
      drawn: n(draft.drawn),
      lost: n(draft.lost),
      goalsFor: n(draft.goalsFor),
      goalsAgainst: n(draft.goalsAgainst),
      points: n(draft.points),
    };
    const res = adding
      ? await createStanding(payload)
      : await updateStanding(editingId!, payload);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    cancel();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este equipo de la clasificación?")) return;
    setBusy(true);
    await deleteStanding(id);
    setBusy(false);
    router.refresh();
  }

  const th = "px-2 py-2 text-center text-[11px] font-semibold text-gris";
  const td = "px-2 py-2 text-center text-sm";

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead className="border-b border-gris/15 bg-beige/60">
            <tr>
              <th className={th + " text-left"}>#</th>
              <th className={th + " text-left"}>Equipo</th>
              <th className={th}>PJ</th>
              <th className={th}>PG</th>
              <th className={th}>PE</th>
              <th className={th}>PP</th>
              <th className={th}>GF</th>
              <th className={th}>GC</th>
              <th className={th}>DG</th>
              <th className={th}>Pts</th>
              {isCoach && <th className={th}></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={isCoach ? 11 : 10}
                  className="px-3 py-6 text-center text-sm text-gris"
                >
                  Sin clasificación todavía.
                </td>
              </tr>
            )}
            {sorted.map((r, i) => {
              const own = r.teamName.toLowerCase().includes("gaztelueta");
              return (
                <tr
                  key={r.id}
                  className={
                    "border-b border-gris/10 " +
                    (own ? "bg-dorado/15 font-semibold" : "")
                  }
                >
                  <td className={td + " text-left text-gris"}>{i + 1}</td>
                  <td className={td + " text-left"}>{r.teamName}</td>
                  <td className={td}>{r.played}</td>
                  <td className={td}>{r.won}</td>
                  <td className={td}>{r.drawn}</td>
                  <td className={td}>{r.lost}</td>
                  <td className={td}>{r.goalsFor}</td>
                  <td className={td}>{r.goalsAgainst}</td>
                  <td className={td}>{r.goalsFor - r.goalsAgainst}</td>
                  <td className={td + " font-bold text-marino"}>{r.points}</td>
                  {isCoach && (
                    <td className={td}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => startEdit(r)}
                          className="rounded-md p-1 text-marino hover:bg-marino/10"
                          aria-label="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove(r.id)}
                          className="rounded-md p-1 text-red-600 hover:bg-red-50"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isCoach && !adding && editingId === null && (
        <div className="border-t border-gris/10 p-3">
          <button className="btn-ghost w-full" onClick={startAdd}>
            <Plus size={16} /> Añadir equipo
          </button>
        </div>
      )}

      {isCoach && (adding || editingId !== null) && (
        <div className="border-t border-gris/10 bg-beige/40 p-4">
          <p className="eyebrow mb-3">
            {adding ? "Nuevo equipo" : "Editar equipo"}
          </p>
          <div className="mb-3">
            <label className="label">Nombre del equipo</label>
            <input
              className="field"
              value={draft.teamName}
              onChange={(e) => setDraft({ ...draft, teamName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                ["played", "PJ"],
                ["won", "PG"],
                ["drawn", "PE"],
                ["lost", "PP"],
                ["goalsFor", "GF"],
                ["goalsAgainst", "GC"],
                ["points", "Pts"],
              ] as [keyof Draft, string][]
            ).map(([key, lbl]) => (
              <div key={key}>
                <label className="label">{lbl}</label>
                <input
                  className="field px-2 text-center"
                  inputMode="numeric"
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-amarillo/25 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1" onClick={save} disabled={busy}>
              {busy && <Loader2 size={16} className="animate-spin" />} Guardar
            </button>
            <button className="btn-ghost" onClick={cancel} disabled={busy}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
