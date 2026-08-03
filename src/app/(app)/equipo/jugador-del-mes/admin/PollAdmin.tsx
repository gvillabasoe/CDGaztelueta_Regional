"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { Switch } from "@/components/Switch";
import {
  closePollNow,
  extendPoll,
  cancelPoll,
  setSelfVote,
  setPollMonth,
  recalcPoll,
  excludeBallot,
  authorizeRevote,
  castBallotOnBehalf,
} from "@/actions/poll";

type Voter = {
  voterId: string;
  name: string;
  kind: "player" | "coach";
  ballotId: string | null;
  excluded: boolean;
};
type Opt = { id: string; name: string };
export type PollAdminData = {
  pollId: string;
  matchLabel: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  effectiveClosed: boolean;
  closesAtLabel: string;
  monthKey: string;
  allowSelfVote: boolean;
  eligibleCount: number;
  votedCount: number;
  voted: Voter[];
  notVoted: { voterId: string; name: string; kind: "player" | "coach" }[];
  onBehalf: { ballotId: string; name: string; excluded: boolean }[];
  candidates: Opt[];
  noAccountPlayers: Opt[];
};

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Abierta", cls: "bg-green-100 text-green-700" },
  CLOSED: { label: "Cerrada", cls: "bg-gris/20 text-gris" },
  CANCELLED: { label: "Anulada", cls: "bg-red-100 text-red-700" },
};

export function PollAdmin({ data }: { data: PollAdminData }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [extend, setExtend] = React.useState("");
  const [month, setMonth] = React.useState(data.monthKey);
  const [msg, setMsg] = React.useState<string | null>(null);

  const st =
    data.effectiveClosed && data.status === "OPEN"
      ? STATUS.CLOSED
      : STATUS[data.status];

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok && r.error) setMsg(r.error);
    else router.refresh();
  }

  const pct = data.eligibleCount
    ? Math.round((data.votedCount / data.eligibleCount) * 100)
    : 0;
  const cancelled = data.status === "CANCELLED";
  const canRegisterOnBehalf = !cancelled && !data.effectiveClosed;

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-semibold text-negro">
          {data.matchLabel}
        </p>
        <span
          className={
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " + st.cls
          }
        >
          {st.label}
        </span>
      </div>
      <p className="text-xs text-gris">
        Mes {data.monthKey} · Cierre {data.closesAtLabel}
      </p>
      <p className="mt-1 text-sm">
        Participación:{" "}
        <span className="font-semibold text-marino">
          {data.votedCount}/{data.eligibleCount}
        </span>{" "}
        ({pct}%)
      </p>

      {!cancelled && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {!data.effectiveClosed && (
              <button
                className="rounded-lg border border-gris/30 px-2.5 py-1.5 text-xs font-semibold text-negro disabled:opacity-50"
                disabled={busy}
                onClick={() => run(() => closePollNow(data.pollId))}
              >
                Cerrar ahora
              </button>
            )}
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-gris/30 px-2.5 py-1.5 text-xs font-semibold text-marino disabled:opacity-50"
              disabled={busy}
              onClick={() => run(() => recalcPoll(data.pollId))}
            >
              <RefreshCw size={12} /> Recalcular
            </button>
            <button
              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                if (confirm("¿Anular esta votación? Se retirarán sus puntos."))
                  run(() => cancelPoll(data.pollId));
              }}
            >
              Anular votación
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-beige px-3 py-2">
            <span className="text-xs font-medium">Permitir voto propio</span>
            <Switch
              checked={data.allowSelfVote}
              onChange={(v) => run(() => setSelfVote(data.pollId, v))}
              label="Voto propio"
            />
          </div>

          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Ampliar / cambiar cierre</label>
              <input
                type="datetime-local"
                className="field"
                value={extend}
                onChange={(e) => setExtend(e.target.value)}
              />
            </div>
            <button
              className="btn-ghost"
              disabled={busy || !extend}
              onClick={() => run(() => extendPoll(data.pollId, extend))}
            >
              Guardar
            </button>
          </div>

          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Mes de los puntos (AAAA-MM)</label>
              <input
                className="field"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <button
              className="btn-ghost"
              disabled={busy}
              onClick={() => run(() => setPollMonth(data.pollId, month))}
            >
              Guardar
            </button>
          </div>
        </>
      )}

      {msg && (
        <p className="mt-2 rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{msg}</p>
      )}

      {/* Voto excepcional en nombre de un jugador sin cuenta */}
      {canRegisterOnBehalf && data.noAccountPlayers.length > 0 && (
        <OnBehalf data={data} busy={busy} run={run} />
      )}

      {/* Participación (sin mostrar el contenido de los votos) */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-marino">
          Ver participación y papeletas
        </summary>
        <div className="mt-2 space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase text-gris">
              Han votado ({data.voted.length})
            </p>
            {data.voted.length === 0 ? (
              <p className="text-xs text-gris">Nadie todavía.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {data.voted.map((v) => (
                  <li
                    key={v.voterId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className={v.excluded ? "text-gris line-through" : ""}>
                      {v.name}
                    </span>
                    {v.ballotId && (
                      <span className="flex gap-2">
                        <button
                          className="text-xs font-semibold text-marino disabled:opacity-50"
                          disabled={busy}
                          onClick={() =>
                            run(() => excludeBallot(v.ballotId!, !v.excluded))
                          }
                        >
                          {v.excluded ? "Restaurar" : "Anular"}
                        </button>
                        <button
                          className="text-xs font-semibold text-red-600 disabled:opacity-50"
                          disabled={busy}
                          onClick={() => {
                            if (
                              confirm(
                                "¿Autorizar un nuevo voto? Se eliminará su papeleta actual y podrá volver a votar.",
                              )
                            )
                              run(() => authorizeRevote(v.ballotId!));
                          }}
                        >
                          Autorizar nuevo voto
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data.onBehalf.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase text-gris">
                Votos registrados por el entrenador ({data.onBehalf.length})
              </p>
              <ul className="mt-1 space-y-1">
                {data.onBehalf.map((o) => (
                  <li
                    key={o.ballotId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className={o.excluded ? "text-gris line-through" : ""}>
                      {o.name} (en su nombre)
                    </span>
                    <span className="flex gap-2">
                      <button
                        className="text-xs font-semibold text-marino disabled:opacity-50"
                        disabled={busy}
                        onClick={() =>
                          run(() => excludeBallot(o.ballotId, !o.excluded))
                        }
                      >
                        {o.excluded ? "Restaurar" : "Anular"}
                      </button>
                      <button
                        className="text-xs font-semibold text-red-600 disabled:opacity-50"
                        disabled={busy}
                        onClick={() => run(() => authorizeRevote(o.ballotId))}
                      >
                        Eliminar
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase text-gris">
              No han votado ({data.notVoted.length})
            </p>
            <p className="mt-1 text-xs text-gris">
              {data.notVoted.map((n) => n.name).join(", ") || "—"}
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}

function OnBehalf({
  data,
  busy,
  run,
}: {
  data: PollAdminData;
  busy: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [player, setPlayer] = React.useState("");
  const [first, setFirst] = React.useState("");
  const [second, setSecond] = React.useState("");
  const [third, setThird] = React.useState("");

  const opts = (exclude: string[]) =>
    data.candidates
      .filter((c) => !exclude.includes(c.id))
      .map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ));

  const complete =
    player &&
    first &&
    second &&
    third &&
    new Set([first, second, third]).size === 3;

  if (!open)
    return (
      <button
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-gris/30 px-2.5 py-1.5 text-xs font-semibold text-marino"
        onClick={() => setOpen(true)}
      >
        <UserPlus size={13} /> Registrar voto de un jugador sin cuenta
      </button>
    );

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-beige/60 p-3">
      <p className="text-xs font-bold uppercase text-marino">
        Voto en nombre de un jugador sin cuenta
      </p>
      <select
        className="field"
        value={player}
        onChange={(e) => setPlayer(e.target.value)}
      >
        <option value="">Elegir jugador…</option>
        {data.noAccountPlayers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <select
          className="field"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        >
          <option value="">3 pts</option>
          {opts([second, third])}
        </select>
        <select
          className="field"
          value={second}
          onChange={(e) => setSecond(e.target.value)}
        >
          <option value="">2 pts</option>
          {opts([first, third])}
        </select>
        <select
          className="field"
          value={third}
          onChange={(e) => setThird(e.target.value)}
        >
          <option value="">1 pt</option>
          {opts([first, second])}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          disabled={busy || !complete}
          onClick={() =>
            run(() =>
              castBallotOnBehalf(data.pollId, player, first, second, third),
            ).then(() => {
              setOpen(false);
              setPlayer("");
              setFirst("");
              setSecond("");
              setThird("");
            })
          }
        >
          Registrar voto
        </button>
        <button className="btn-ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
