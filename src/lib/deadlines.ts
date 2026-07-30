// Cierre del plazo de asistencia a ENTRENAMIENTOS: 14:00 del mismo día,
// en zona Europe/Madrid (con horario de verano/invierno), usando hora de
// servidor. No depende del reloj del dispositivo del jugador.
const TZ = "Europe/Madrid";

function madridParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) parts[p.type] = p.value;
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10),
  };
}

export function isTrainingAttendanceClosed(
  trainingDate: Date,
  now: Date = new Date(),
): boolean {
  const day = madridParts(trainingDate).ymd;
  const cur = madridParts(now);
  if (cur.ymd > day) return true; // ya pasó el día del entrenamiento
  if (cur.ymd < day) return false; // todavía no es el día
  return cur.minutes >= 14 * 60; // mismo día: cerrado a partir de las 14:00
}

// ── "Jugador del Mes": cálculo de cierre y mes, en Europe/Madrid ──

function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour === 24 ? 0 : +parts.hour,
    +parts.minute,
    +parts.second,
  );
  return asUTC - date.getTime(); // ms que el huso va por delante de UTC
}

// Convierte una hora "de pared" de Madrid (y,m,d,hh,mm) al instante UTC correcto.
function madridWallClockToUtc(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
): Date {
  const naive = Date.UTC(y, m - 1, d, hh, mm, 0);
  const off = tzOffsetMs(new Date(naive), TZ);
  return new Date(naive - off);
}

// Mes ("YYYY-MM") al que pertenece la fecha del partido, en Madrid.
export function matchMonthKey(matchDate: Date): string {
  return madridParts(matchDate).ymd.slice(0, 7);
}

// Cierre por defecto: el martes siguiente al partido a las 23:59 (Madrid).
export function defaultPollClose(matchDate: Date): Date {
  const ymd = madridParts(matchDate).ymd; // fecha del partido en Madrid
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Dom … 6=Sáb
  let delta = (2 - dow + 7) % 7; // 2 = martes
  if (delta === 0) delta = 7; // si el partido es martes, el martes siguiente
  const target = new Date(Date.UTC(y, m - 1, d + delta));
  return madridWallClockToUtc(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    target.getUTCDate(),
    23,
    59,
  );
}

// Interpreta un valor de <input type="datetime-local"> ("YYYY-MM-DDTHH:MM")
// como hora de pared de Madrid y devuelve el instante UTC correspondiente.
export function parseMadridLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s);
  if (!m) return null;
  return madridWallClockToUtc(+m[1], +m[2], +m[3], +m[4], +m[5]);
}
