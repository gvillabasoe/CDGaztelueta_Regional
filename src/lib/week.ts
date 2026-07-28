// Utilidades de semana ISO y fechas de la planificación.
// Funciones puras (sin dependencias de servidor), usables en cliente y servidor.

export const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[(dayOfWeek - 1 + 7) % 7] ?? "";
}

// "YYYY-Www" (valor de <input type="week">) → lunes de esa semana (fecha local)
export function isoWeekToMonday(weekStr: string): Date | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  // El 4 de enero siempre cae en la semana ISO 1.
  const jan4 = new Date(year, 0, 4);
  const jan4Dow = (jan4.getDay() + 6) % 7; // 0 = lunes … 6 = domingo
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Dow);
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Fecha → "YYYY-Www" (para rellenar el <input type="week">)
export function dateToIsoWeek(input: Date): string {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const dow = (date.getDay() + 6) % 7;
  // El jueves de la semana decide el año ISO.
  const thursday = new Date(date);
  thursday.setDate(date.getDate() - dow + 3);
  const year = thursday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(
    ((thursday.getTime() - jan1.getTime()) / 86400000 + 1) / 7,
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Lunes de la semana que contiene la fecha dada.
export function mondayOf(input: Date): Date {
  const d = new Date(input);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Fecha/hora concreta de un entrenamiento planificado.
export function plannedDateTime(
  weekStart: Date,
  dayOfWeek: number,
  time: string,
): Date {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + (dayOfWeek - 1));
  const [h, mi] = (time || "00:00").split(":");
  d.setHours(Number(h) || 0, Number(mi) || 0, 0, 0);
  return d;
}
