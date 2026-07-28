"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Switch } from "@/components/Switch";
import { FinesEditor } from "./FinesEditor";
import { saveMatch, updateMatch } from "@/actions/match";
import type {
  CardInput,
  FineInput,
  GoalInput,
  MatchPlayerInput,
  PlayerLite,
  SubInput,
} from "@/lib/types";

function playerName(p: PlayerLite) {
  const base = `${p.firstName} ${p.lastName}`;
  return p.nickname?.trim() ? `${p.nickname} · ${base}` : base;
}

function buildRows(
  players: PlayerLite[],
  initialPlayers?: MatchPlayerInput[],
): MatchPlayerInput[] {
  const byId = new Map(
    (initialPlayers ?? []).map((p) => [p.playerId, p] as const),
  );
  return players.map((p) => {
    const f = byId.get(p.id);
    return f
      ? { ...f }
      : {
          playerId: p.id,
          isStarter: false,
          position: null,
          grade: null,
          observations: null,
        };
  });
}

type MatchInitial = {
  date: string;
  opponent: string;
  formation: string | null;
  teamGoals: number;
  opponentGoals: number;
  globalGrade: number | null;
  generalObservations: string | null;
  players: MatchPlayerInput[];
  goals: GoalInput[];
  substitutions: SubInput[];
  cards: CardInput[];
  fines: FineInput[];
};

export function MatchForm({
  players,
  today,
  mode = "create",
  recordId,
  initial,
}: {
  players: PlayerLite[];
  today: string;
  mode?: "create" | "edit";
  recordId?: string;
  initial?: MatchInitial;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? today);
  const [opponent, setOpponent] = useState(initial?.opponent ?? "");
  const [formation, setFormation] = useState(initial?.formation ?? "");
  const [teamGoals, setTeamGoals] = useState(initial?.teamGoals ?? 0);
  const [opponentGoals, setOpponentGoals] = useState(
    initial?.opponentGoals ?? 0,
  );
  const [rows, setRows] = useState<MatchPlayerInput[]>(
    buildRows(players, initial?.players),
  );
  const [goals, setGoals] = useState<GoalInput[]>(initial?.goals ?? []);
  const [subs, setSubs] = useState<SubInput[]>(initial?.substitutions ?? []);
  const [cards, setCards] = useState<CardInput[]>(initial?.cards ?? []);
  const [globalGrade, setGlobalGrade] = useState<number | null>(
    initial?.globalGrade ?? null,
  );
  const [generalObs, setGeneralObs] = useState(
    initial?.generalObservations ?? "",
  );
  const [fines, setFines] = useState<FineInput[]>(initial?.fines ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patchRow(i: number, p: Partial<MatchPlayerInput>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      date,
      opponent,
      formation: formation || null,
      teamGoals,
      opponentGoals,
      globalGrade,
      generalObservations: generalObs || null,
      players: rows,
      goals,
      substitutions: subs,
      cards,
      fines,
    };
    const res =
      mode === "edit" && recordId
        ? await updateMatch(recordId, payload)
        : await saveMatch(payload);
    setSaving(false);
    if (res.ok) {
      router.push("/coach/registro");
      router.refresh();
    } else {
      setError(res.error || "No se ha podido guardar.");
    }
  }

  const noPlayers = players.length === 0;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Datos generales */}
      <div className="card space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="fecha-part">
              Fecha
            </label>
            <input
              id="fecha-part"
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="rival">
              Rival
            </label>
            <input
              id="rival"
              className="field"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Equipo rival"
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="formacion">
            Formación
          </label>
          <input
            id="formacion"
            className="field"
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            placeholder="Ej. 4-3-3"
          />
        </div>

        <div>
          <span className="label">Resultado</span>
          <div className="flex items-center justify-center gap-3">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              aria-label="Goles del equipo"
              className="field w-20 text-center font-display text-lg"
              value={teamGoals}
              onChange={(e) => setTeamGoals(parseInt(e.target.value) || 0)}
            />
            <span className="font-display text-lg text-gris">-</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              aria-label="Goles del rival"
              className="field w-20 text-center font-display text-lg"
              value={opponentGoals}
              onChange={(e) => setOpponentGoals(parseInt(e.target.value) || 0)}
            />
          </div>
          <p className="mt-1 text-center text-[11px] text-gris">
            CD Gaztelueta · Rival
          </p>
        </div>
      </div>

      {noPlayers ? (
        <p className="card p-6 text-center text-sm text-gris">
          Crea fichas de jugadores en “Mi Equipo” para poder registrar el
          partido.
        </p>
      ) : (
        <>
          {/* Jugadores */}
          <div className="space-y-3">
            <p className="eyebrow">Jugadores</p>
            {rows.map((row, i) => (
              <div key={row.playerId} className="card space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-marino">
                    {playerName(players[i])}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-gris">
                    Titular
                    <Switch
                      checked={row.isStarter}
                      onChange={(v) => patchRow(i, { isStarter: v })}
                      label="Titular"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="label">Posición</span>
                    <input
                      className="field"
                      value={row.position ?? ""}
                      onChange={(e) =>
                        patchRow(i, { position: e.target.value })
                      }
                    />
                  </div>
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
                        patchRow(i, {
                          grade:
                            e.target.value === ""
                              ? null
                              : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <span className="label">Observaciones</span>
                  <input
                    className="field"
                    value={row.observations ?? ""}
                    onChange={(e) =>
                      patchRow(i, { observations: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Goles */}
          <div className="card space-y-3 p-4">
            <p className="eyebrow">Goles</p>
            {goals.map((g, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <span className="label">Goleador</span>
                  <select
                    className="field"
                    value={g.playerId}
                    onChange={(e) =>
                      setGoals((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, playerId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Selecciona…</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {playerName(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <span className="label">Min.</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="field"
                    value={g.minute ?? ""}
                    onChange={(e) =>
                      setGoals((prev) =>
                        prev.map((x, idx) =>
                          idx === i
                            ? {
                                ...x,
                                minute:
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setGoals((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="mb-1 rounded-lg p-2 text-gris hover:text-marino"
                  aria-label="Eliminar gol"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() =>
                setGoals((prev) => [...prev, { playerId: "", minute: null }])
              }
            >
              <Plus size={16} /> Añadir gol
            </button>
          </div>

          {/* Cambios */}
          <div className="card space-y-3 p-4">
            <p className="eyebrow">Cambios</p>
            {subs.map((s, i) => (
              <div key={i} className="space-y-2 rounded-xl bg-beige/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gris">
                    Cambio {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSubs((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="rounded-lg p-1.5 text-gris hover:text-marino"
                    aria-label="Eliminar cambio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="label">Sale</span>
                    <select
                      className="field"
                      value={s.playerOutId}
                      onChange={(e) =>
                        setSubs((prev) =>
                          prev.map((x, idx) =>
                            idx === i
                              ? { ...x, playerOutId: e.target.value }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="">Selecciona…</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {playerName(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="label">Entra</span>
                    <select
                      className="field"
                      value={s.playerInId}
                      onChange={(e) =>
                        setSubs((prev) =>
                          prev.map((x, idx) =>
                            idx === i
                              ? { ...x, playerInId: e.target.value }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="">Selecciona…</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {playerName(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="w-24">
                  <span className="label">Minuto</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="field"
                    value={s.minute ?? ""}
                    onChange={(e) =>
                      setSubs((prev) =>
                        prev.map((x, idx) =>
                          idx === i
                            ? {
                                ...x,
                                minute:
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() =>
                setSubs((prev) => [
                  ...prev,
                  { playerOutId: "", playerInId: "", minute: null },
                ])
              }
            >
              <Plus size={16} /> Añadir cambio
            </button>
          </div>

          {/* Tarjetas */}
          <div className="card space-y-3 p-4">
            <p className="eyebrow">Tarjetas</p>
            {cards.map((c, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <span className="label">Jugador</span>
                  <select
                    className="field"
                    value={c.playerId}
                    onChange={(e) =>
                      setCards((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, playerId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Selecciona…</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {playerName(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <span className="label">Tipo</span>
                  <select
                    className="field"
                    value={c.type}
                    onChange={(e) =>
                      setCards((prev) =>
                        prev.map((x, idx) =>
                          idx === i
                            ? { ...x, type: e.target.value as CardInput["type"] }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="YELLOW">Amarilla</option>
                    <option value="RED">Roja</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCards((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="mb-1 rounded-lg p-2 text-gris hover:text-marino"
                  aria-label="Eliminar tarjeta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() =>
                setCards((prev) => [...prev, { playerId: "", type: "YELLOW" }])
              }
            >
              <Plus size={16} /> Añadir tarjeta
            </button>
          </div>

          {/* Nota global y observaciones */}
          <div className="card space-y-3 p-4">
            <div>
              <span className="label">Nota global del equipo (1-10)</span>
              <input
                type="number"
                min="1"
                max="10"
                step="0.1"
                inputMode="decimal"
                className="field"
                value={globalGrade ?? ""}
                onChange={(e) =>
                  setGlobalGrade(
                    e.target.value === "" ? null : parseFloat(e.target.value),
                  )
                }
              />
            </div>
            <div>
              <span className="label">Observaciones generales</span>
              <textarea
                className="field min-h-[80px] resize-y"
                value={generalObs}
                onChange={(e) => setGeneralObs(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {/* Multas */}
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
          disabled={saving || noPlayers}
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
