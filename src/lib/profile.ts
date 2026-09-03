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
