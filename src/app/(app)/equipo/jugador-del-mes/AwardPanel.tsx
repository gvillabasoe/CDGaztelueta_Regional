"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy, Check } from "lucide-react";
import { applyMonthlyAward } from "@/actions/fine";

export type AwardData = {
  monthKey: string;
  monthLabel: string;
  monthOver: boolean;
  alreadyApplied: boolean;
  appliedLabel: string | null;
  winnerName: string | null;
  totalPending: number;
  hasPayments: boolean;
  fines: {
    id: string;
    dateLabel: string;
    concept: string;
    amount: number;
    paid: number;
    pending: number;
    forgiven: boolean;
  }[];
};

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

// Aplicación del premio: solo entrenador y solo con el mes terminado.
export function AwardPanel({ data }: { data: AwardData }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = React.useState(false);

  async function apply(confirmPayments: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await applyMonthlyAward(data.monthKey, confirmPayments);
      if (!res.ok) {
        if ("needsPaymentConfirm" in res && res.needsPaymentConfirm)
          setNeedsConfirm(true);
        setMsg(res.error);
        return;
      }
      setNeedsConfirm(false);
      setMsg(
        res.count === 0
          ? "Premio registrado. No había multas pendientes de ese mes."
          : `Premio aplicado: ${res.count} ${res.count === 1 ? "multa perdonada" : "multas perdonadas"}.`,
      );
      router.refresh();
    } catch (err) {
      console.error("aplicar premio", err);
      setMsg("No se ha podido aplicar el premio. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <p className="eyebrow mb-2 flex items-center gap-1.5">
        <Trophy size={14} className="text-dorado" /> Aplicar premio del mes
      </p>

      <p className="text-sm text-negro">
        Mes: <span className="font-semibold capitalize">{data.monthLabel}</span>
      </p>
      <p className="text-sm text-negro">
        Jugador del Mes:{" "}
        <span className="font-semibold">
          {data.winnerName ?? "todavía sin ganador"}
        </span>
      </p>

      {data.alreadyApplied ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-sm font-semibold text-green-700">
          <Check size={15} /> Premio ya aplicado
          {data.appliedLabel ? ` · ${data.appliedLabel}` : ""}
        </p>
      ) : !data.monthOver ? (
        <p className="mt-2 rounded-lg bg-beige px-3 py-2 text-xs text-negro">
          El premio podrá aplicarse cuando termine el mes y el ganador sea
          definitivo.
        </p>
      ) : !data.winnerName ? (
        <p className="mt-2 rounded-lg bg-beige px-3 py-2 text-xs text-negro">
          Este mes no tiene un ganador con puntos.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            Importe afectado:{" "}
            <span className="font-display text-lg font-bold text-marino">
              {eur(data.totalPending)}
            </span>
          </p>

          {data.fines.length === 0 ? (
            <p className="mt-1 text-xs text-gris">
              El ganador no tiene multas de ese mes.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {data.fines.map((f) => (
                <li key={f.id} className="flex justify-between text-xs">
                  <span className="min-w-0 truncate text-negro">
                    {f.dateLabel} · {f.concept}
                  </span>
                  <span className="ml-2 shrink-0 text-gris">
                    {eur(f.amount)}
                    {f.paid > 0 ? ` · pagado ${eur(f.paid)}` : ""}
                    {f.forgiven ? " · perdonada" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {data.hasPayments && (
            <p className="mt-2 rounded-lg bg-amarillo/25 px-3 py-2 text-xs text-negro">
              Atención: alguna multa de ese mes ya tiene importes abonados. Esos
              pagos no se devuelven ni se borran; solo se perdonará la parte que
              siga pendiente.
            </p>
          )}

          {msg && (
            <p className="mt-2 rounded-lg bg-beige px-3 py-2 text-sm">{msg}</p>
          )}

          <button
            className="btn-gold mt-3 w-full"
            disabled={busy}
            onClick={() => apply(needsConfirm)}
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {needsConfirm
              ? "CONFIRMAR Y APLICAR PREMIO"
              : "APLICAR PREMIO: PERDONAR MULTAS DEL MES"}
          </button>
        </>
      )}

      {data.alreadyApplied && msg && (
        <p className="mt-2 rounded-lg bg-beige px-3 py-2 text-sm">{msg}</p>
      )}
    </div>
  );
}
