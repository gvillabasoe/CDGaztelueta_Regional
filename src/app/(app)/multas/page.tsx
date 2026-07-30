import { getSession } from "@/lib/session";
import { finesForMonth, finesGrandTotal, playersLite } from "@/lib/queries";
import { formatDateShort, toDateInputValue } from "@/lib/format";
import { MultasView } from "./MultasView";

export const dynamic = "force-dynamic";

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

  // Cantidad efectivamente pagada (migra multas antiguas marcadas "paid" sin importe).
  const paidOf = (f: { amountPaid: number; paid: boolean; amount: number }) =>
    Math.min(f.amountPaid > 0 ? f.amountPaid : f.paid ? f.amount : 0, f.amount);

  const map = new Map<
    string,
    {
      player: { id: string; firstName: string; lastName: string };
      fines: typeof fines;
    }
  >();
  for (const f of fines) {
    if (!map.has(f.playerId))
      map.set(f.playerId, { player: f.player, fines: [] });
    map.get(f.playerId)!.fines.push(f);
  }

  const groups = Array.from(map.values())
    .map(({ player, fines }) => {
      const items = fines.map((f) => {
        const paid = paidOf(f);
        const pending = Math.max(0, f.amount - paid);
        const status =
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
      const status =
        pending <= 0 ? "PAGADO" : paid > 0 ? "PARCIAL" : "PENDIENTE";
      return {
        playerId: player.id,
        name: `${player.firstName} ${player.lastName}`,
        fines: items,
        total,
        paid,
        pending,
        status,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const monthTotal = groups.reduce((s, g) => s + g.total, 0);
  const monthPaid = groups.reduce((s, g) => s + g.paid, 0);
  const monthPending = groups.reduce((s, g) => s + g.pending, 0);
  const playersWithDebt = groups.filter((g) => g.pending > 0).length;

  return (
    <MultasView
      isCoach={isCoach}
      year={year}
      month0={month0}
      groups={groups}
      monthTotal={monthTotal}
      monthPaid={monthPaid}
      monthPending={monthPending}
      playersWithDebt={playersWithDebt}
      grandTotal={grandTotal}
      players={players}
    />
  );
}
