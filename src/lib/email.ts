// Normaliza un correo para comparaciones robustas (minúsculas y sin espacios).
export function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}
