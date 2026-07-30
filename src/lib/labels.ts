// Etiquetas en español para enums (compartidas cliente/servidor).
export const ABSENCE_REASONS = [
  "LESION",
  "ENFERMEDAD",
  "TRABAJO",
  "ESTUDIOS",
  "VIAJE",
  "FAMILIAR",
  "OTRO",
] as const;

export const ABSENCE_LABEL: Record<string, string> = {
  LESION: "Lesión",
  ENFERMEDAD: "Enfermedad",
  TRABAJO: "Trabajo",
  ESTUDIOS: "Estudios",
  VIAJE: "Viaje",
  FAMILIAR: "Motivo familiar",
  OTRO: "Otro motivo",
};

export const PROPOSAL_STATUSES = [
  "PENDIENTE",
  "EN_REVISION",
  "ACEPTADA",
  "RECHAZADA",
] as const;

export const PROPOSAL_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_REVISION: "En revisión",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

export const PROPOSAL_BADGE: Record<string, string> = {
  PENDIENTE: "bg-gris/20 text-gris",
  EN_REVISION: "bg-amarillo/30 text-negro",
  ACEPTADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
};
