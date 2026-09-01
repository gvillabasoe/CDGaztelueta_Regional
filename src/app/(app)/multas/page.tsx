import { getSession } from "@/lib/session";
import {
  finesForMonth,
  finesGrandTotal,
  playersLite,
  staffLite,
  myFinesSummary,
  canManageFinePayments,
  paidOfFine,
} from "@/lib/queries";
import { formatDateShort, toDateInputValue } from "@/lib/format";
import { MultasView } from "./MultasView";

export const dynamic = "force-dynamic";

type Status = "PENDIENTE" | "PARCIAL" | "PAGADO";

export default async function MultasPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const session = await getSession();
  const isCoach = session?.role === "COACH";
  const now = new Date();

  const year = parseInt(searchParams.y ?? "", 10) || now.getFullYear();
  const mRaw = parseInt(searchParams.m ?? "", 10);
  const month0 =
    (Number.isFinite(mRaw) && mRaw >= 1 && mRaw <= 12
      ? mRaw
      : now.getMonth() + 1) - 1;

  const fines = await finesForMonth(year, month0);
  const grandTotal = await finesGrandTotal();
  const players = isCoach ? await playersLite() : [];
  const staff = isCoach ? await staffLite() : [];
  const mine = await myFinesSummary();
  const canPay = await canManageFinePayments();

  // Agrupación por MIEMBRO (jugador o cuerpo técnico) con la misma lógica.
  const map = new Map<
    string,
    { kind: "player" | "staff"; name: string; fines: typeof fines }
  >();
  for (const f of fines) {
    const key = f.playerId
      ? `p:${f.playerId}`
      : f.staffUserId
        ? `s:${f.staffUserId}`
        : null;
    if (!key) continue; // multa sin destinatario: no debería existir
    if (!map.has(key)) {
      const name = f.player
        ? `${f.player.firstName} ${f.player.lastName}`
        : f.staffUser
          ? f.staffUser.displayName?.trim() || f.staffUser.username
          : "Sin destinatario";
      map.set(key, {
        kind: f.playerId ? "player" : "staff",
        name,
        fines: [],
      });
    }
    map.get(key)!.fines.push(f);
  }

  const groups = Array.from(map.entries())
    .map(([key, { kind, name, fines: list }]) => {
      const items = list.map((f) => {
        const paid = paidOfFine(f);
        const pending = Math.max(0, f.amount - paid);
        const status: Status =
          pending <= 0 ? "PAGADO" : paid > 0 ? "PARCIAL" : "PENDIENTE";
        return {
          id: f.id,
          dateShort: formatDateShort(f.date),
          dateInput: toDateInputValue(f.date),
          concept: f.concept,
          amount: f.amount,
          amountPaid: paid,
          pending,
          status,
        };
      });
      const total = items.reduce((s, f) => s + f.amount, 0);
      const paid = items.reduce((s, f) => s + f.amountPaid, 0);
      const pending = items.reduce((s, f) => s + f.pending, 0);
      const status: Status =
        pending <= 0 ? "PAGADO" : paid > 0 ? "PARCIAL" : "PENDIENTE";
      return { key, kind, name, fines: items, total, paid, pending, status };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  // Totales del mes: SIEMPRE sobre jugadores + cuerpo técnico.
  const monthTotal = groups.reduce((s, g) => s + g.total, 0);
  const monthPaid = groups.reduce((s, g) => s + g.paid, 0);
  const monthPending = groups.reduce((s, g) => s + g.pending, 0);
  const peopleWithDebt = groups.filter((g) => g.pending > 0).length;

  return (
    <MultasView
      isCoach={isCoach}
      canPay={canPay}
      year={year}
      month0={month0}
      groups={groups}
      monthTotal={monthTotal}
      monthPaid={monthPaid}
      monthPending={monthPending}
      peopleWithDebt={peopleWithDebt}
      grandTotal={grandTotal}
      players={players}
      staff={staff}
      myPending={mine.pending}
    />
  );
}
