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
  Check,
} from "lucide-react";
import { formatEuro } from "@/lib/format";
import {
  createFines,
  updateFine,
  setFinePayment,
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

type Status = "PENDIENTE" | "PARCIAL" | "PAGADO";
type Fine = {
  id: string;
  dateShort: string;
  dateInput: string;
  concept: string;
  amount: number;
  amountPaid: number;
  pending: number;
  status: Status;
};
type Group = {
  key: string;
  kind: "player" | "staff";
  name: string;
  fines: Fine[];
  total: number;
  paid: number;
  pending: number;
  status: Status;
};

function statusMeta(s: Status) {
  if (s === "PAGADO") return { label: "Pagado", cls: "bg-green-100 text-green-700" };
  if (s === "PARCIAL") return { label: "Pago parcial", cls: "bg-amarillo/30 text-negro" };
  return { label: "Pendiente", cls: "bg-red-100 text-red-700" };
}

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function MultasView({
  isCoach,
  canPay,
  year,
  month0,
  groups,
  monthTotal,
  monthPaid,
  monthPending,
  peopleWithDebt,
  grandTotal,
  players,
  staff,
  myPending,
}: {
  isCoach: boolean;
  canPay: boolean;
  year: number;
  month0: number;
  groups: Group[];
  monthTotal: number;
  monthPaid: number;
  monthPending: number;
  peopleWithDebt: number;
  grandTotal: number;
  players: PlayerLite[];
  staff: { id: string; name: string }[];
  myPending: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  function goto(y: number, m0: number) {
    router.push(`/multas?y=${y}&m=${m0 + 1}`);
  }
  function prev() {
    month0 - 1 < 0 ? goto(year - 1, 11) : goto(year, month0 - 1);
  }
  function next() {
    month0 + 1 > 11 ? goto(year + 1, 0) : goto(year, month0 + 1);
  }

  // Alta de multa (entrenador)
  const [adding, setAdding] = React.useState(false);
  const [sel, setSel] = React.useState<string[]>([]);
  const [selStaff, setSelStaff] = React.useState<string[]>([]);
  const [date, setDate] = React.useState(today());
  const [concept, setConcept] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [addErr, setAddErr] = React.useState<string | null>(null);

  async function submitAdd() {
    setAddErr(null);
    setBusy("add");
    try {
      const res = await createFines({
        playerIds: sel,
        staffUserIds: selStaff,
        date,
        concept,
        amount: parseFloat(amount.replace(",", ".")) || 0,
      });
      if (!res.ok) {
        setAddErr(res.error);
        return;
      }
      setAdding(false);
      setSel([]);
      setSelStaff([]);
      setConcept("");
      setAmount("");
      router.refresh();
    } catch (err) {
      console.error("crear multa", err);
      setAddErr("No se ha podido guardar la multa. Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-negro">Multas</h1>

      {/* Resumen personal (misma lógica que el aviso del menú) */}
      <div
        className={
          "card p-4 " +
          (myPending > 0
            ? "border border-red-200 bg-red-50"
            : "border border-green-200 bg-green-50")
        }
      >
        <p className="eyebrow mb-1">Mis multas</p>
        <p className="font-display text-2xl font-bold text-negro">
          Pendiente de pago: {formatEuro(myPending)}
        </p>
        {myPending > 0 ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-red-700">
            <span aria-hidden className="text-base leading-none">⚠</span>
            Tienes multas pendientes de pago.
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <Check size={15} /> No tienes multas pendientes.
          </p>
        )}
      </div>

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
          <p className="text-[11px] text-gris">Total mes</p>
        </div>
        <div className="card p-3 text-center">
          <p className="font-display text-lg font-bold text-green-700">
            {formatEuro(monthPaid)}
          </p>
          <p className="text-[11px] text-gris">Recaudado</p>
        </div>
        <div className="card p-3 text-center">
          <p className="font-display text-lg font-bold text-red-600">
            {formatEuro(monthPending)}
          </p>
          <p className="text-[11px] text-gris">Pendiente</p>
        </div>
      </div>
      <p className="-mt-2 px-1 text-xs text-gris">
        {peopleWithDebt}{" "}
        {peopleWithDebt === 1
          ? "persona con pagos pendientes"
          : "personas con pagos pendientes"}{" "}
        (jugadores y cuerpo técnico).
      </p>

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
          {staff.length > 0 && (
            <>
              <label className="label">Cuerpo técnico</label>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {staff.map((t) => {
                  const on = selStaff.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setSelStaff((s2) =>
                          on ? s2.filter((i) => i !== t.id) : [...s2, t.id],
                        )
                      }
                      className={
                        "chip border " +
                        (on
                          ? "border-dorado bg-dorado text-negro"
                          : "border-gris/30 bg-blanco text-negro")
                      }
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
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
              <label className="label">Motivo</label>
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

      {/* Listado: misma fuente de datos, dos bloques visuales */}
      {groups.length === 0 ? (
        <div className="card p-6 text-center text-sm text-gris">
          No hay multas en {MONTHS[month0]} {year}.
        </div>
      ) : (
        <div className="space-y-5">
          {(
            [
              ["player", "Jugadores"],
              ["staff", "Cuerpo técnico"],
            ] as const
          ).map(([kind, title]) => {
            const list = groups.filter((g) => g.kind === kind);
            if (list.length === 0) return null;
            return (
              <div key={kind}>
                <h2 className="eyebrow mb-2 px-1">{title}</h2>
                <div className="space-y-3">
                  {list.map((g) => (
                    <MemberCard
                      key={g.key}
                      group={g}
                      isCoach={isCoach}
                      canPay={canPay}
                      busy={busy}
                      setBusy={setBusy}
                      refresh={() => router.refresh()}
                    />
                  ))}
                </div>
              </div>
            );
          })}
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
  canPay,
  busy,
  onPayAll,
  onSetPending,
  onPay,
  onDelete,
  onSave,
}: {
  fine: Fine;
  isCoach: boolean;
  canPay: boolean; // rol entrenador o permiso económico
  busy: boolean;
  onPayAll: () => void;
  onSetPending: () => void;
  onPay: (amt: number) => Promise<string | null>;
  onDelete: () => void;
  onSave: (d: {
    date: string;
    concept: string;
    amount: number;
    amountPaid: number;
  }) => Promise<string | null>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [date, setDate] = React.useState(fine.dateInput);
  const [concept, setConcept] = React.useState(fine.concept);
  const [amount, setAmount] = React.useState(String(fine.amount));
  const [amountPaid, setAmountPaid] = React.useState(String(fine.amountPaid));
  const [payValue, setPayValue] = React.useState(String(fine.amountPaid));
  const [err, setErr] = React.useState<string | null>(null);
  const meta = statusMeta(fine.status);

  if (editing) {
    return (
      <li className="space-y-2 bg-beige/40 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Importe</label>
            <input
              className="field"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pagado</label>
            <input
              className="field"
              inputMode="decimal"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
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
          <div>
            <label className="label">Motivo</label>
            <input
              className="field"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
          </div>
        </div>
        {err && <p className="rounded bg-amarillo/25 px-2 py-1 text-xs">{err}</p>}
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1 py-2 text-xs"
            disabled={busy}
            onClick={async () => {
              const e = await onSave({
                date,
                concept,
                amount: parseFloat(amount.replace(",", ".")) || 0,
                amountPaid: parseFloat(amountPaid.replace(",", ".")) || 0,
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
    <li className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-negro">{fine.concept}</p>
          <p className="text-xs text-gris">
            {fine.dateShort} · {formatEuro(fine.amountPaid)} de{" "}
            {formatEuro(fine.amount)}
            {fine.pending > 0 ? ` · faltan ${formatEuro(fine.pending)}` : ""}
          </p>
        </div>
        <span
          className={
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
            meta.cls
          }
        >
          {meta.label}
        </span>
        {/* Permiso económico: solo alternar pendiente/pagada. */}
        {!isCoach && canPay && (
          <button
            onClick={fine.pending > 0 ? onPayAll : onSetPending}
            disabled={busy}
            className={
              "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-50 " +
              (fine.pending > 0
                ? "bg-green-600 text-white"
                : "border border-gris/30 text-negro")
            }
          >
            {busy ? (
              <Loader2 size={12} className="inline animate-spin" />
            ) : fine.pending > 0 ? (
              "Marcar pagada"
            ) : (
              "Volver a pendiente"
            )}
          </button>
        )}
        {isCoach && (
          <>
            <button
              onClick={() => {
                setPaying((v) => !v);
                setPayValue(String(fine.amountPaid));
              }}
              className="rounded p-1 text-marino hover:bg-marino/10"
              aria-label="Registrar pago"
              title="Registrar pago"
            >
              <Wallet size={14} />
            </button>
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
      </div>

      {isCoach && paying && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-beige/60 p-2">
          <span className="text-xs text-gris">Pagado:</span>
          <input
            className="field w-24 py-1 text-center"
            inputMode="decimal"
            value={payValue}
            onChange={(e) => setPayValue(e.target.value)}
          />
          <button
            className="rounded-lg bg-marino px-2.5 py-1.5 text-xs font-semibold text-blanco disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              const e = await onPay(parseFloat(payValue.replace(",", ".")) || 0);
              if (!e) setPaying(false);
            }}
          >
            Guardar pago
          </button>
          <button
            className="rounded-lg border border-green-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-green-700"
            disabled={busy}
            onClick={onPayAll}
          >
            Pagar todo
          </button>
          {fine.amountPaid > 0 && (
            <button
              className="rounded-lg border border-gris/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-gris"
              disabled={busy}
              onClick={onSetPending}
            >
              Marcar pendiente
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function MemberCard({
  group: g,
  isCoach,
  canPay,
  busy,
  setBusy,
  refresh,
}: {
  group: Group;
  isCoach: boolean;
  canPay: boolean;
  busy: string | null;
  setBusy: (v: string | null) => void;
  refresh: () => void;
}) {
  const debt = g.pending > 0;

  // Envoltura común: la carga termina siempre, también si falla la operación.
  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    try {
      await fn();
      refresh();
    } catch (err) {
      console.error("operación de multa", err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-gris/10 bg-beige/50 px-4 py-2.5">
        <span
          className={
            "flex min-w-0 items-center gap-1.5 font-semibold " +
            (debt ? "text-red-600" : "text-negro")
          }
        >
          {debt ? (
            <span aria-hidden className="shrink-0 text-base leading-none">
              ⚠
            </span>
          ) : (
            <Check size={15} className="shrink-0 text-green-600" />
          )}
          <span className="truncate">{g.name}</span>
          {g.kind === "staff" && (
            <span className="chip shrink-0 bg-marino/10 text-[10px] text-marino">
              Entrenador
            </span>
          )}
        </span>
        <span
          className={
            "shrink-0 text-sm font-semibold " +
            (debt ? "text-red-600" : "text-green-700")
          }
        >
          {debt ? `${formatEuro(g.pending)} pendiente` : "Pagado"}
        </span>
      </div>

      <ul className="divide-y divide-gris/10">
        {g.fines.map((f) => (
          <FineRow
            key={f.id}
            fine={f}
            isCoach={isCoach}
            canPay={canPay}
            busy={busy === f.id}
            onPayAll={() => run(f.id, () => setFinePaid(f.id, true))}
            onSetPending={() => run(f.id, () => setFinePaid(f.id, false))}
            onPay={async (amt) => {
              setBusy(f.id);
              try {
                const r = await setFinePayment(f.id, amt);
                if (r.ok) refresh();
                return r.ok ? null : r.error;
              } catch (err) {
                console.error("registrar pago", err);
                return "No se ha podido registrar el pago.";
              } finally {
                setBusy(null);
              }
            }}
            onDelete={async () => {
              if (!confirm("¿Eliminar esta multa?")) return;
              await run(f.id, () => deleteFine(f.id));
            }}
            onSave={async (d) => {
              setBusy(f.id);
              try {
                const r = await updateFine(f.id, d);
                if (r.ok) refresh();
                return r.ok ? null : r.error;
              } catch (err) {
                console.error("guardar multa", err);
                return "No se ha podido guardar la multa.";
              } finally {
                setBusy(null);
              }
            }}
          />
        ))}
      </ul>

      <div className="flex flex-wrap justify-end gap-3 border-t border-gris/10 px-4 py-2 text-xs">
        <span className="text-gris">
          {g.fines.length}{" "}
          {g.fines.length === 1 ? "multa" : "multas"}
        </span>
        <span className="text-gris">Total {formatEuro(g.total)}</span>
        <span className="text-green-700">Pagado {formatEuro(g.paid)}</span>
        <span className="text-red-600">Pendiente {formatEuro(g.pending)}</span>
      </div>
    </div>
  );
}
