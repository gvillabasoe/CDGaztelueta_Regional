"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { castBallot } from "@/actions/poll";

type Cand = {
  id: string;
  firstName: string;
  lastName: string;
  number: number | null;
};

export function VoteForm({
  pollId,
  candidates,
}: {
  pollId: string;
  candidates: Cand[];
}) {
  const router = useRouter();
  const [first, setFirst] = React.useState("");
  const [second, setSecond] = React.useState("");
  const [third, setThird] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const label = (c: Cand) =>
    `${c.number != null ? "#" + c.number + " " : ""}${c.firstName} ${c.lastName}`;
  const nameOf = (id: string) => {
    const c = candidates.find((x) => x.id === id);
    return c ? label(c) : "—";
  };

  const chosen = [first, second, third].filter(Boolean);
  const distinct = new Set(chosen).size === chosen.length;
  const complete = !!first && !!second && !!third && distinct;

  function opts(exclude: string[]) {
    return candidates
      .filter((c) => !exclude.includes(c.id))
      .map((c) => (
        <option key={c.id} value={c.id}>
          {label(c)}
        </option>
      ));
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await castBallot({
      pollId,
      firstId: first,
      secondId: second,
      thirdId: third,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          <Check size={26} />
        </div>
        <p className="text-sm text-negro">
          Tu votación se ha registrado correctamente.
        </p>
        <button
          className="btn-primary mt-4 w-full"
          onClick={() => {
            router.push("/equipo/jugador-del-mes");
            router.refresh();
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div>
          <label className="label">3 puntos — más destacado</label>
          <select
            className="field"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          >
            <option value="">Elegir jugador…</option>
            {opts([second, third])}
          </select>
        </div>
        <div>
          <label className="label">2 puntos — segundo</label>
          <select
            className="field"
            value={second}
            onChange={(e) => setSecond(e.target.value)}
          >
            <option value="">Elegir jugador…</option>
            {opts([first, third])}
          </select>
        </div>
        <div>
          <label className="label">1 punto — tercero</label>
          <select
            className="field"
            value={third}
            onChange={(e) => setThird(e.target.value)}
          >
            <option value="">Elegir jugador…</option>
            {opts([first, second])}
          </select>
        </div>
      </div>

      {complete && (
        <div className="card p-4">
          <p className="eyebrow mb-2">Resumen de tu votación</p>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between">
              <span>3 puntos</span>
              <span className="font-semibold">{nameOf(first)}</span>
            </li>
            <li className="flex justify-between">
              <span>2 puntos</span>
              <span className="font-semibold">{nameOf(second)}</span>
            </li>
            <li className="flex justify-between">
              <span>1 punto</span>
              <span className="font-semibold">{nameOf(third)}</span>
            </li>
          </ul>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}

      <button
        className="btn-primary w-full"
        onClick={confirm}
        disabled={!complete || busy}
      >
        {busy && <Loader2 size={16} className="animate-spin" />} CONFIRMAR
        VOTACIÓN
      </button>
      <p className="text-center text-xs text-gris">
        Tu voto es anónimo. Solo puedes votar una vez por partido.
      </p>
    </div>
  );
}
