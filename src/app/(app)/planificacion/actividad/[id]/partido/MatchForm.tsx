"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/Switch";
import { FinesAdder } from "../FinesAdder";
import { saveMatch, updateMatch } from "@/actions/match";
import type {
  CardInput,
  GoalInput,
  MatchPlayerInput,
  NewFineInput,
  PlayerLite,
  SaveMatchInput,
  SubInput,
} from "@/lib/types";

type Row = {
  playerId: string;
  name: string;
  isStarter: boolean;
  position: string;
  grade: string;
  observations: string;
};
type GoalRow = { key: string; playerId: string; minute: string };
type SubRow = { key: string; playerOutId: string; playerInId: string; minute: string };
type CardRow = { key: string; playerId: string; type: "YELLOW" | "RED" };

let c = 0;
const uid = () => `r${Date.now()}_${c++}`;

function parseGrade(s: string): number | null | "bad" {
  if (!s.trim()) return null;
  const v = parseFloat(s.replace(",", "."));
  if (!Number.isFinite(v) || v < 1 || v > 10) return "bad";
  return v;
}
const int0 = (s: string) => {
  const v = parseInt(s, 10);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};
const intOrNull = (s: string) => {
  const v = parseInt(s, 10);
  return Number.isFinite(v) ? v : null;
};

export function MatchForm({
  activityId,
  mode,
  recordId,
  initialDate,
  initialOpponent,
  players,
  initialPlayers,
  initialGoals,
  initialSubs,
  initialCards,
  initialFormation,
  initialTeamGoals,
  initialOpponentGoals,
  initialGlobalGrade,
  initialGeneralObs,
}: {
  activityId: string;
  mode: "create" | "edit";
  recordId?: string;
  initialDate: string;
  initialOpponent: string;
  players: PlayerLite[];
  initialPlayers: MatchPlayerInput[];
  initialGoals: GoalInput[];
  initialSubs: SubInput[];
  initialCards: CardInput[];
  initialFormation: string;
  initialTeamGoals: number;
  initialOpponentGoals: number;
  initialGlobalGrade: number | null;
  initialGeneralObs: string;
}) {
  const router = useRouter();
  const initMap = new Map(initialPlayers.map((p) => [p.playerId, p]));

  const [date, setDate] = React.useState(initialDate);
  const [opponent, setOpponent] = React.useState(initialOpponent);
  const [formation, setFormation] = React.useState(initialFormation);
  const [teamGoals, setTeamGoals] = React.useState(String(initialTeamGoals));
  const [oppGoals, setOppGoals] = React.useState(String(initialOpponentGoals));
  const [globalGrade, setGlobalGrade] = React.useState(
    initialGlobalGrade != null ? String(initialGlobalGrade) : "",
  );
  const [generalObs, setGeneralObs] = React.useState(initialGeneralObs);

  const [rows, setRows] = React.useState<Row[]>(
    players.map((p) => {
      const r = initMap.get(p.id);
      return {
        playerId: p.id,
        name: `${p.firstName} ${p.lastName}`,
        isStarter: r?.isStarter ?? false,
        position: r?.position ?? "",
        grade: r?.grade != null ? String(r.grade) : "",
        observations: r?.observations ?? "",
      };
    }),
  );
  const [goals, setGoals] = React.useState<GoalRow[]>(
    initialGoals.map((g) => ({
      key: uid(),
      playerId: g.playerId,
      minute: g.minute != null ? String(g.minute) : "",
    })),
  );
  const [subs, setSubs] = React.useState<SubRow[]>(
    initialSubs.map((s) => ({
      key: uid(),
      playerOutId: s.playerOutId,
      playerInId: s.playerInId,
      minute: s.minute != null ? String(s.minute) : "",
    })),
  );
  const [cards, setCards] = React.useState<CardRow[]>(
    initialCards.map((c2) => ({
      key: uid(),
      playerId: c2.playerId,
      type: c2.type,
    })),
  );
  const [newFines, setNewFines] = React.useState<NewFineInput[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function patchRow(id: string, p: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.playerId === id ? { ...r, ...p } : r)));
  }

  const opts = (
    <>
      <option value="">—</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.number != null ? `#${p.number} ` : ""}
          {p.firstName} {p.lastName}
        </option>
      ))}
    </>
  );

  async function save() {
    setError(null);
    const gg = parseGrade(globalGrade);
    if (gg === "bad") {
      setError("La nota global debe estar entre 1 y 10.");
      return;
    }
    const players2: MatchPlayerInput[] = [];
    for (const r of rows) {
      const g = parseGrade(r.grade);
      if (g === "bad") {
        setError(`La nota de ${r.name} debe estar entre 1 y 10.`);
        return;
      }
      players2.push({
        playerId: r.playerId,
        isStarter: r.isStarter,
        position: r.position.trim() || null,
        grade: g,
        observations: r.observations.trim() || null,
      });
    }

    const payload: SaveMatchInput = {
      activityId,
      date,
      opponent,
      formation: formation.trim() || null,
      teamGoals: int0(teamGoals),
      opponentGoals: int0(oppGoals),
      globalGrade: gg,
      generalObservations: generalObs.trim() || null,
      players: players2,
      goals: goals
        .filter((g) => g.playerId)
        .map((g) => ({ playerId: g.playerId, minute: intOrNull(g.minute) })),
      substitutions: subs
        .filter((s) => s.playerOutId && s.playerInId)
        .map((s) => ({
          playerOutId: s.playerOutId,
          playerInId: s.playerInId,
          minute: intOrNull(s.minute),
        })),
      cards: cards
        .filter((c2) => c2.playerId)
        .map((c2) => ({ playerId: c2.playerId, type: c2.type })),
      newFines,
    };

    setSaving(true);
    const res =
      mode === "create"
        ? await saveMatch(payload)
        : await updateMatch(recordId!, payload);
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
      {/* Datos generales */}
      <div className="card space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Fecha</label>
            <input
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Rival</label>
            <input
              className="field"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Goles CD Gaztelueta</label>
            <input
              className="field text-center"
              inputMode="numeric"
              value={teamGoals}
              onChange={(e) => setTeamGoals(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Goles rival</label>
            <input
              className="field text-center"
              inputMode="numeric"
              value={oppGoals}
              onChange={(e) => setOppGoals(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Formación</label>
            <input
              className="field"
              placeholder="4-3-3"
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Nota global (1–10)</label>
            <input
              className="field text-center"
              inputMode="decimal"
              value={globalGrade}
              onChange={(e) => setGlobalGrade(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Observaciones generales</label>
            <textarea
              className="field"
              rows={2}
              value={generalObs}
              onChange={(e) => setGeneralObs(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Jugadores */}
      <div className="card p-4">
        <p className="eyebrow mb-3">Jugadores</p>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.playerId} className="rounded-xl border border-gris/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-negro">{r.name}</span>
                <label className="flex items-center gap-2 text-xs text-gris">
                  Titular
                  <Switch
                    checked={r.isStarter}
                    onChange={(v) => patchRow(r.playerId, { isStarter: v })}
                    label="Titular"
                  />
                </label>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input
                  className="field"
                  placeholder="Posición"
                  value={r.position}
                  onChange={(e) =>
                    patchRow(r.playerId, { position: e.target.value })
                  }
                />
                <input
                  className="field text-center"
                  inputMode="decimal"
                  placeholder="Nota"
                  value={r.grade}
                  onChange={(e) =>
                    patchRow(r.playerId, { grade: e.target.value })
                  }
                />
                <input
                  className="field"
                  placeholder="Obs."
                  value={r.observations}
                  onChange={(e) =>
                    patchRow(r.playerId, { observations: e.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goles */}
      <div className="card p-4">
        <p className="eyebrow mb-3">Goles</p>
        <div className="space-y-2">
          {goals.map((g) => (
            <div key={g.key} className="flex items-center gap-2">
              <select
                className="field flex-1"
                value={g.playerId}
                onChange={(e) =>
                  setGoals((gs) =>
                    gs.map((x) =>
                      x.key === g.key ? { ...x, playerId: e.target.value } : x,
                    ),
                  )
                }
              >
                {opts}
              </select>
              <input
                className="field w-20 text-center"
                inputMode="numeric"
                placeholder="min"
                value={g.minute}
                onChange={(e) =>
                  setGoals((gs) =>
                    gs.map((x) =>
                      x.key === g.key ? { ...x, minute: e.target.value } : x,
                    ),
                  )
                }
              />
              <button
                onClick={() =>
                  setGoals((gs) => gs.filter((x) => x.key !== g.key))
                }
                className="rounded p-1.5 text-red-600 hover:bg-red-50"
                aria-label="Quitar gol"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            className="btn-ghost w-full"
            onClick={() =>
              setGoals((gs) => [
                ...gs,
                { key: uid(), playerId: "", minute: "" },
              ])
            }
          >
            <Plus size={16} /> Añadir gol
          </button>
        </div>
      </div>

      {/* Cambios */}
      <div className="card p-4">
        <p className="eyebrow mb-3">Cambios</p>
        <div className="space-y-2">
          {subs.map((s) => (
            <div key={s.key} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <select
                className="field"
                value={s.playerOutId}
                onChange={(e) =>
                  setSubs((ss) =>
                    ss.map((x) =>
                      x.key === s.key
                        ? { ...x, playerOutId: e.target.value }
                        : x,
                    ),
                  )
                }
              >
                {opts}
              </select>
              <select
                className="field"
                value={s.playerInId}
                onChange={(e) =>
                  setSubs((ss) =>
                    ss.map((x) =>
                      x.key === s.key
                        ? { ...x, playerInId: e.target.value }
                        : x,
                    ),
                  )
                }
              >
                {opts}
              </select>
              <div className="flex items-center gap-1">
                <input
                  className="field w-16 text-center"
                  inputMode="numeric"
                  placeholder="min"
                  value={s.minute}
                  onChange={(e) =>
                    setSubs((ss) =>
                      ss.map((x) =>
                        x.key === s.key ? { ...x, minute: e.target.value } : x,
                      ),
                    )
                  }
                />
                <button
                  onClick={() =>
                    setSubs((ss) => ss.filter((x) => x.key !== s.key))
                  }
                  className="rounded p-1.5 text-red-600 hover:bg-red-50"
                  aria-label="Quitar cambio"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="col-span-3 -mt-1 text-[11px] text-gris">
                Sale → Entra
              </p>
            </div>
          ))}
          <button
            className="btn-ghost w-full"
            onClick={() =>
              setSubs((ss) => [
                ...ss,
                { key: uid(), playerOutId: "", playerInId: "", minute: "" },
              ])
            }
          >
            <Plus size={16} /> Añadir cambio
          </button>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="card p-4">
        <p className="eyebrow mb-3">Tarjetas</p>
        <div className="space-y-2">
          {cards.map((c2) => (
            <div key={c2.key} className="flex items-center gap-2">
              <select
                className="field flex-1"
                value={c2.playerId}
                onChange={(e) =>
                  setCards((cs) =>
                    cs.map((x) =>
                      x.key === c2.key ? { ...x, playerId: e.target.value } : x,
                    ),
                  )
                }
              >
                {opts}
              </select>
              <select
                className="field w-32"
                value={c2.type}
                onChange={(e) =>
                  setCards((cs) =>
                    cs.map((x) =>
                      x.key === c2.key
                        ? { ...x, type: e.target.value as "YELLOW" | "RED" }
                        : x,
                    ),
                  )
                }
              >
                <option value="YELLOW">Amarilla</option>
                <option value="RED">Roja</option>
              </select>
              <button
                onClick={() =>
                  setCards((cs) => cs.filter((x) => x.key !== c2.key))
                }
                className="rounded p-1.5 text-red-600 hover:bg-red-50"
                aria-label="Quitar tarjeta"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            className="btn-ghost w-full"
            onClick={() =>
              setCards((cs) => [
                ...cs,
                { key: uid(), playerId: "", type: "YELLOW" },
              ])
            }
          >
            <Plus size={16} /> Añadir tarjeta
          </button>
        </div>
      </div>

      {/* Multas */}
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
