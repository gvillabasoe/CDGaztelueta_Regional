const TZ = "Europe/Madrid";

export function formatDateLong(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(d);
}

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export function toDateInputValue(d: Date): string {
  // yyyy-mm-dd para <input type="date">
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatGrade(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(1).replace(".", ",");
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

// Fecha + hora en Europe/Madrid, p. ej. "martes, 12 de agosto, 23:59".
export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid",
  }).format(d);
}

// Fecha + hora corta en Europe/Madrid, p. ej. "12/08/2026, 19:30".
export function formatDateTimeShort(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid",
  }).format(d);
}
