"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Switch } from "@/components/Switch";
import { createPoll } from "@/actions/poll";

type Match = { id: string; label: string; calledIds: string[] };
type P = { id: string; name: string };

export function CreatePoll({
  matches,
  players,
}: {
  matches: Match[];
  players: P[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [matchId, setMatchId] = React.useState("");
  const [cands, setCands] = React.useState<string[]>([]);
  const [selfVote, setSelfVote] = React.useState(false);
  const [closesAt, setClosesAt] = React.useState("");
  const [needDeadline, setNeedDeadline] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function pickMatch(id: string) {
    setMatchId(id);
    const m = matches.find((x) => x.id === id);
    const called = new Set(m?.calledIds ?? []);
    setCands(players.filter((p) => called.has(p.id)).map((p) => p.id));
  }
  function toggle(id: string) {
    setCands((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  async function submit() {
    setError(null);
    if (!matchId) return setError("Elige un partido.");
    setBusy(true);
    const res = await createPoll({
      activityId: matchId,
      allowSelfVote: selfVote,
      candidateIds: cands,
      closesAt: closesAt || null,
    });
    setBusy(false);
    if (!res.ok) {
      if ("needsDeadline" in res && res.needsDeadline) setNeedDeadline(true);
      setError(res.error);
      return;
    }
    setOpen(false);
    setMatchId("");
    setCands([]);
    setClosesAt("");
    setNeedDeadline(false);
    router.refresh();
  }

  if (matches.length === 0)
    return (
      <div className="card p-4 text-sm text-gris">
        No hay partidos sin votación. Crea primero el partido en Planificación.
      </div>
    );

  if (!open)
    return (
      <button className="btn-gold w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Crear votación
      </button>
    );

  return (
    <div className="card space-y-3 p-4">
      <p className="eyebrow">Nueva votación</p>
      <div>
        <label className="label">Partido</label>
        <select
          className="field"
          value={matchId}
          onChange={(e) => pickMatch(e.target.value)}
        >
          <option value="">Elegir partido…</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Candidatos (mín. 3)</label>
        <div className="flex flex-wrap gap-1.5">
          {players.map((p) => {
            const on = cands.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={
                  "chip border " +
                  (on
                    ? "border-marino bg-marino text-blanco"
                    : "border-gris/30 bg-blanco text-negro")
                }
              >
                {p.name}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-gris">{cands.length} seleccionados</p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-beige px-3 py-2.5">
        <span className="text-sm font-medium">Permitir voto propio</span>
        <Switch checked={selfVote} onChange={setSelfVote} label="Voto propio" />
      </div>

      <div>
        <label className="label">
          Cierre {needDeadline ? "(obligatorio)" : "(opcional · por defecto martes 23:59)"}
        </label>
        <input
          type="datetime-local"
          className="field"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}

      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={submit} disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />} Crear
        </button>
        <button className="btn-ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
