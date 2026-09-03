import "server-only";
import { prisma } from "@/lib/prisma";

// Periodos bimensuales de la LIGA interna. Estructura configurable: para añadir
// un periodo posterior basta con ampliar esta lista.
// startMonth es 1-12; el periodo cubre startMonth y el siguiente.
const PERIOD_DEFS = [
  { startMonth: 9, name: "Septiembre-Octubre" },
  { startMonth: 11, name: "Noviembre-Diciembre" },
  { startMonth: 1, name: "Enero-Febrero" },
  { startMonth: 3, name: "Marzo-Abril" },
  { startMonth: 5, name: "Mayo-Junio" },
];

const pad = (n: number) => String(n).padStart(2, "0");

// Año y mes actuales en Europe/Madrid (los cierres usan esta zona horaria).
export function madridYearMonth(d = new Date()): { year: number; month: number } {
  const ym = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
  }).format(d);
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  return { year: y, month: m };
}

export type PeriodDef = {
  key: string;
  name: string;
  startDate: Date;
  endDate: Date; // exclusivo
};

// Periodo al que pertenece una fecha. Devuelve null en julio y agosto: son
// meses fuera de los periodos definidos y NO se inventa un periodo para ellos.
export function periodForYearMonth(year: number, month: number): PeriodDef | null {
  const def = PERIOD_DEFS.find(
    (d) => month === d.startMonth || month === d.startMonth + 1,
  );
  if (!def) return null;
  const startYear = month === def.startMonth ? year : year;
  const start = new Date(Date.UTC(startYear, def.startMonth - 1, 1));
  const end = new Date(Date.UTC(startYear, def.startMonth + 1, 1));
  return {
    key: `${startYear}-${pad(def.startMonth)}_${startYear}-${pad(def.startMonth + 1)}`,
    name: `${def.name} ${startYear}`,
    startDate: start,
    endDate: end,
  };
}

export function periodForDate(date: Date): PeriodDef | null {
  const { year, month } = madridYearMonth(date);
  return periodForYearMonth(year, month);
}

// Crea el periodo si no existe (idempotente por la clave única) y lo devuelve.
export async function ensurePeriod(def: PeriodDef) {
  return prisma.leaguePeriod.upsert({
    where: { key: def.key },
    update: {},
    create: {
      key: def.key,
      name: def.name,
      startDate: def.startDate,
      endDate: def.endDate,
    },
  });
}

// Periodo de una fecha, creándolo si hace falta. null si la fecha no encaja.
export async function periodIdForDate(date: Date): Promise<string | null> {
  const def = periodForDate(date);
  if (!def) return null;
  try {
    const p = await ensurePeriod(def);
    return p.id;
  } catch (err) {
    console.error("periodIdForDate", err);
    return null;
  }
}

// Periodo en curso (o null en julio/agosto).
export async function currentPeriod() {
  const def = periodForDate(new Date());
  if (!def) return null;
  try {
    return await ensurePeriod(def);
  } catch (err) {
    console.error("currentPeriod", err);
    return null;
  }
}

// Cierra los periodos ya vencidos y abre el siguiente. IDEMPOTENTE: solo actúa
// sobre periodos con endDate pasada y closed = false, y la instantánea usa una
// restricción única por (periodo, jugador), así que no puede duplicarse.
export async function closeDuePeriods() {
  try {
    const now = new Date();
    const due = await prisma.leaguePeriod.findMany({
      where: { closed: false, endDate: { lte: now } },
      orderBy: { startDate: "asc" },
    });

    for (const period of due) {
      const entries = await prisma.leaguePointEntry.findMany({
        where: { periodId: period.id },
        select: { playerId: true, points: true },
      });

      const totals = new Map<string, number>();
      for (const e of entries)
        totals.set(e.playerId, (totals.get(e.playerId) ?? 0) + e.points);

      // Se incluyen los jugadores activos aunque terminen a 0 puntos.
      const active = await prisma.player.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, nickname: true },
      });
      const ids = new Set([...totals.keys(), ...active.map((p) => p.id)]);
      const extra = await prisma.player.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, firstName: true, lastName: true, nickname: true },
      });
      const nameOf = new Map(
        extra.map((p) => [
          p.id,
          (p.nickname?.trim() || `${p.firstName} ${p.lastName}`.trim()) ||
            "Jugador",
        ]),
      );

      const table = [...ids]
        .map((id) => ({
          playerId: id,
          points: totals.get(id) ?? 0,
          name: nameOf.get(id) ?? "Jugador",
        }))
        .sort(
          (a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"),
        );

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < table.length; i++) {
          const row = table[i];
          await tx.leaguePeriodResult.upsert({
            where: {
              periodId_playerId: {
                periodId: period.id,
                playerId: row.playerId,
              },
            },
            update: {
              position: i + 1,
              points: row.points,
              playerName: row.name,
              inPunishment: i + 1 >= 11,
            },
            create: {
              periodId: period.id,
              playerId: row.playerId,
              playerName: row.name,
              position: i + 1,
              points: row.points,
              inPunishment: i + 1 >= 11,
            },
          });
        }
        await tx.leaguePeriod.update({
          where: { id: period.id },
          data: { closed: true, closedAt: new Date() },
        });
      });
    }

    // Abre el periodo que corresponde a hoy (todos empiezan a 0 porque la
    // clasificación se calcula desde los movimientos de ese periodo).
    await currentPeriod();
    return { ok: true as const, closed: due.length };
  } catch (err) {
    console.error("closeDuePeriods", err);
    return { ok: false as const, closed: 0 };
  }
}

// Asigna a su periodo los movimientos que todavía no lo tienen, usando SU FECHA.
// Idempotente: solo toca los que tienen periodId null. Los que caen fuera de los
// periodos definidos (julio/agosto) se dejan sin asignar a propósito: no se
// inventa una fecha ni se inyectan en el periodo en curso.
export async function backfillEntryPeriods() {
  try {
    const pending = await prisma.leaguePointEntry.findMany({
      where: { periodId: null },
      select: { id: true, date: true },
      take: 2000,
    });
    let assigned = 0;
    for (const e of pending) {
      const periodId = await periodIdForDate(e.date);
      if (!periodId) continue; // se conserva sin periodo
      await prisma.leaguePointEntry.update({
        where: { id: e.id },
        data: { periodId },
      });
      assigned++;
    }
    return { assigned, skipped: pending.length - assigned };
  } catch (err) {
    console.error("backfillEntryPeriods", err);
    return { assigned: 0, skipped: 0 };
  }
}
