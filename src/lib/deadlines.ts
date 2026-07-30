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
