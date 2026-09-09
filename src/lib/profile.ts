// Nombre visible público: el mote es el identificador principal y, si está
// vacío, se usa el nombre real como respaldo. Nunca devuelve null ni vacío.
export function publicName(
  nickname: string | null | undefined,
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null,
): string {
  const nick = (nickname ?? "").trim();
  if (nick) return nick;
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  if (full) return full;
  const f = (fallback ?? "").trim();
  return f || "Jugador";
}

// Etiqueta de un evento de votación (partido o cena). La cena usa siempre el
// icono de fiesta acompañado de texto, nunca solo el símbolo.
export function eventLabel(a: {
  type: string;
  opponent?: string | null;
  matchday?: number | null;
}): string {
  if (a.type === "DINNER") return "🎉 JORNADA NOCTURNA – CENA DE EQUIPO";
  const jornada = a.matchday != null ? `Jornada ${a.matchday} – ` : "";
  return jornada + (a.opponent ? `CD Gaztelueta vs ${a.opponent}` : "Partido");
}
