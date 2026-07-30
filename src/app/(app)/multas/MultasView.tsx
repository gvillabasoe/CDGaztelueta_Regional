"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wallet,
} from "lucide-react";
import { formatEuro } from "@/lib/format";
import {
  createFines,
  updateFine,
  setFinePaid,
  deleteFine,
} from "@/actions/fine";
import type { PlayerLite } from "@/lib/types";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type Fine = {
  id: string;
  dateShort: string;
  dateInput: string;
  concept: string;
  amount: number;
  paid: boolean;
};
type Group = {
  playerId: string;
  name: string;
  fines: Fine[];
  total: number;
  pending: number;
  paid: number;
};

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function MultasView({
  isCoach,
  year,
  month0,
  groups,
  monthTotal,
  monthPending,
  monthPaid,
  grandTotal,
  players,
}: {
  isCoach: boolean;
  year: number;
  month0: number;
  groups: Group[];
  monthTotal: number;
  monthPending: number;
  monthPaid: number;
  grandTotal: number;
  players: PlayerLite[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  function goto(y: number, m0: number) {
    router.push(`/multas?y=${y}&m=${m0 + 1}`);
  }
  function prev() {
    const m = month0 - 1;
    if (m < 0) goto(year - 1, 11);
    else goto(year, m);
  }
  function next() {
    const m = month0 + 1;
    if (m > 11) goto(year + 1, 0);
    else goto(year, m);
  }

  // ── Alta de multa (entrenador) ──
  const [adding, setAdding] = React.useState(false);
  const [sel, setSel] = React.useState<string[]>([]);
  const [date, setDate] = React.useState(today());
  const [concept, setConcept] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [addErr, setAddErr] = React.useState<string | null>(null);

  async function submitAdd() {
    setAddErr(null);
    setBusy("add");
    const res = await createFines({
      playerIds: sel,
      date,
      concept,
      amount: parseFloat(amount.replace(",", ".")) || 0,
    });
    setBusy(null);
    if (!res.ok) {
      setAddErr(res.error);
      return;
    }
    setAdding(false);
    setSel([]);
    setConcept("");
    setAmount("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-negro">Multas</h1>

      {/* Selector de mes */}
      <div className="card flex items-center justify-between p-2">
        <button
          onClick={prev}
          className="rounded-lg p-2 text-marino hover:bg-marino/10"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <select
          className="field w-auto border-0 text-center font-semibold"
          value={month0}
          onChange={(e) => goto(year, parseInt(e.target.value, 10))}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m} {year}
            </option>
          ))}
        </select>
        <button
          onClick={next}
          className="rounded-lg p-2 text-marino hover:bg-marino/10"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Totales del mes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <p className="font-display text-lg font-bold text-marino">
            {formatEuro(monthTotal)}
          </p>
          <p className="text-[11px] text-gris">Mes</p>
        </div>
        <div className="card p-3 text-center">
          <p className="font-display text-lg font-bold text-red-600">
            {formatEuro(monthPending)}
          </p>
          <p className="text-[11px] text-gris">Pendiente</p>
        </div>
        <div className="card p-3 text-center">
          <p className="font-display text-lg font-bold text-green-700">
            {formatEuro(monthPaid)}
          </p>
          <p className="text-[11px] text-gris">Pagado</p>
        </div>
      </div>

      {isCoach && !adding && (
        <button className="btn-gold w-full" onClick={() => setAdding(true)}>
          <Plus size={16} /> Añadir multa
        </button>
      )}

      {isCoach && adding && (
        <div className="card p-4">
          <p className="eyebrow mb-3">Nueva multa</p>
          <label className="label">Jugadores</label>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {players.map((p) => {
              const on = sel.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setSel((s) =>
                      on ? s.filter((i) => i !== p.id) : [...s, p.id],
                    )
                  }
                  className={
                    "chip border " +
                    (on
                      ? "border-marino bg-marino text-blanco"
                      : "border-gris/30 bg-blanco text-negro")
                  }
                >
                  {p.firstName} {p.lastName}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Importe (€)</label>
              <input
                className="field"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Concepto</label>
              <input
                className="field"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
              />
            </div>
          </div>
          {addErr && (
            <p className="mt-3 rounded-lg bg-amarillo/25 px-3 py-2 text-sm">
              {addErr}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              className="btn-primary flex-1"
              onClick={submitAdd}
              disabled={busy === "add"}
            >
              {busy === "add" && <Loader2 size={16} className="animate-spin" />}{" "}
              Guardar
            </button>
            <button className="btn-ghost" onClick={() => setAdding(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Listado por jugador */}
      {groups.length === 0 ? (
        <div className="card p-6 text-center text-sm text-gris">
          No hay multas en {MONTHS[month0]} {year}.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.playerId} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-gris/10 bg-beige/50 px-4 py-2.5">
                <span className="font-semibold text-negro">{g.name}</span>
                <span className="font-display font-bold text-marino">
                  {formatEuro(g.total)}
                </span>
              </div>
              <ul className="divide-y divide-gris/10">
                {g.fines.map((f) => (
                  <FineRow
                    key={f.id}
                    fine={f}
                    isCoach={isCoach}
                    busy={busy === f.id}
                    onPaid={async (paid) => {
                      setBusy(f.id);
                      await setFinePaid(f.id, paid);
                      setBusy(null);
                      router.refresh();
                    }}
                    onDelete={async () => {
                      if (!confirm("¿Eliminar esta multa?")) return;
                      setBusy(f.id);
                      await deleteFine(f.id);
                      setBusy(null);
                      router.refresh();
                    }}
                    onSave={async (d) => {
                      setBusy(f.id);
                      const res = await updateFine(f.id, d);
                      setBusy(null);
                      if (res.ok) router.refresh();
                      return res.ok ? null : res.error;
                    }}
                  />
                ))}
              </ul>
              <div className="flex justify-end gap-3 border-t border-gris/10 px-4 py-2 text-xs">
                <span className="text-red-600">
                  Pendiente {formatEuro(g.pending)}
                </span>
                <span className="text-green-700">
                  Pagado {formatEuro(g.paid)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total de la temporada */}
      <div className="card flex items-center justify-between bg-marino p-4 text-beige">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Wallet size={16} /> Total de la plantilla (temporada)
        </span>
        <span className="font-display text-xl font-bold text-dorado">
          {formatEuro(grandTotal)}
        </span>
      </div>
    </div>
  );
}

function FineRow({
  fine,
  isCoach,
  busy,
  onPaid,
  onDelete,
  onSave,
}: {
  fine: Fine;
  isCoach: boolean;
  busy: boolean;
  onPaid: (paid: boolean) => void;
  onDelete: () => void;
  onSave: (d: {
    date: string;
    concept: string;
    amount: number;
    paid: boolean;
  }) => Promise<string | null>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [date, setDate] = React.useState(fine.dateInput);
  const [concept, setConcept] = React.useState(fine.concept);
  const [amount, setAmount] = React.useState(String(fine.amount));
  const [err, setErr] = React.useState<string | null>(null);

  if (editing) {
    return (
      <li className="space-y-2 bg-beige/40 p-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="field"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="date"
            className="field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            className="field col-span-2"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
        </div>
        {err && (
          <p className="rounded bg-amarillo/25 px-2 py-1 text-xs">{err}</p>
        )}
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1 py-2 text-xs"
            disabled={busy}
            onClick={async () => {
              const e = await onSave({
                date,
                concept,
                amount: parseFloat(amount.replace(",", ".")) || 0,
                paid: fine.paid,
              });
              if (e) setErr(e);
              else setEditing(false);
            }}
          >
            Guardar
          </button>
          <button
            className="btn-ghost py-2 text-xs"
            onClick={() => setEditing(false)}
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-negro">{fine.concept}</p>
        <p className="text-xs text-gris">{fine.dateShort}</p>
      </div>
      <span className="font-medium text-negro">{formatEuro(fine.amount)}</span>
      {isCoach ? (
        <button
          onClick={() => onPaid(!fine.paid)}
          disabled={busy}
          className={
            "rounded-full px-2 py-0.5 text-[11px] font-semibold " +
            (fine.paid
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700")
          }
        >
          {busy ? "…" : fine.paid ? "Pagado" : "Pendiente"}
        </button>
      ) : (
        <span
          className={
            "rounded-full px-2 py-0.5 text-[11px] font-semibold " +
            (fine.paid
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700")
          }
        >
          {fine.paid ? "Pagado" : "Pendiente"}
        </span>
      )}
      {isCoach && (
        <>
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1 text-marino hover:bg-marino/10"
            aria-label="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-red-600 hover:bg-red-50"
            aria-label="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </li>
  );
}
