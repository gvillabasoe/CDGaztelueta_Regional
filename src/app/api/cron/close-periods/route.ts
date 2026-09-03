import { NextResponse } from "next/server";
import { closeDuePeriods, backfillEntryPeriods } from "@/lib/periods";

// Cierre automático de periodos ejecutado por el servidor (Vercel Cron), sin
// depender de que nadie tenga la aplicación abierta. Es idempotente: si no hay
// periodos vencidos, no hace nada.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const backfill = await backfillEntryPeriods();
  const res = await closeDuePeriods();
  return NextResponse.json({
    ok: res.ok,
    periodosCerrados: res.closed,
    movimientosAsignados: backfill.assigned,
    movimientosSinPeriodo: backfill.skipped,
  });
}
