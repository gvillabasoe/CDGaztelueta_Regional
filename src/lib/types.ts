// Tipos compartidos entre componentes cliente y Server Actions.

export type PlayerLite = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  number: number | null;
  positions: string[];
};

// ── Fichas de jugador (7) ─────────────────────────────────────────
export type PlayerStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export type PlayerFichaInput = {
  firstName: string;
  lastName: string;
  nickname: string | null;
  number: number | null;
  age: number | null;
  isCaptain: boolean;
  positions: string[];
  photo: string | null; // data URL o null
  email: string | null; // correo (para vincular cuenta)
  phone: string | null; // teléfono opcional
  // Cuenta de acceso OPCIONAL al crear la ficha:
  username: string; // vacío = ficha sin cuenta
  password: string; // vacío = ficha sin cuenta
};

export type PlayerEditInput = {
  firstName: string;
  lastName: string;
  nickname: string | null;
  number: number | null;
  age: number | null;
  isCaptain: boolean;
  positions: string[];
  photo: string | null;
  email: string | null;
  phone: string | null;
  status: PlayerStatus;
  // Estadísticas (manuales, 7.2)
  callups: number;
  minutes: number;
  starts: number;
  benchCount: number;
  goalsCount: number;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// ── Planificación (8) ─────────────────────────────────────────────
export type PlanActivityInput = {
  id?: string;
  type: "TRAINING" | "MATCH";
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string | null;
  place: string | null;
  opponent: string | null;
  matchday: number | null;
  callTime: string | null;
  kitLocal: boolean | null;
  calledPlayerIds: string[]; // convocatoria (máx. 18)
};

export type PlanInput = {
  week: string; // YYYY-Www
  published: boolean;
  activities: PlanActivityInput[];
};

export type ExerciseInput = {
  id?: string;
  task: string;
  description: string | null;
  objective: string | null;
  duration: string | null;
  scorable: boolean;
  maxPoints: number | null;
  scoringInfo: string | null;
};

export type AssignEntry = {
  playerId: string;
  points: number;
  note: string | null;
};

// ── Registros posteriores (8.6 / 8.7) ─────────────────────────────
export type NewFineInput = {
  playerIds: string[];
  date: string; // yyyy-mm-dd
  concept: string;
  amount: number;
};

export type TrainingPlayerInput = {
  playerId: string;
  attended: boolean;
  justified: boolean | null;
  absenceReason: string | null;
  grade: number | null;
  observations: string | null;
};

export type SaveTrainingInput = {
  activityId: string;
  date: string;
  players: TrainingPlayerInput[];
  newFines: NewFineInput[];
};

export type MatchPlayerInput = {
  playerId: string;
  isStarter: boolean;
  position: string | null;
  grade: number | null;
  observations: string | null;
};

export type GoalInput = { playerId: string; minute: number | null };
export type SubInput = {
  playerOutId: string;
  playerInId: string;
  minute: number | null;
};
export type CardInput = { playerId: string; type: "YELLOW" | "RED" };

export type SaveMatchInput = {
  activityId: string;
  date: string;
  opponent: string;
  formation: string | null;
  teamGoals: number;
  opponentGoals: number;
  globalGrade: number | null;
  generalObservations: string | null;
  players: MatchPlayerInput[];
  goals: GoalInput[];
  substitutions: SubInput[];
  cards: CardInput[];
  newFines: NewFineInput[];
};

// ── Valoración de ejercicios (8.8) ────────────────────────────────
export type ExerciseRatingInput = { exerciseId: string; rating: number };

// ── Multas (10) ───────────────────────────────────────────────────
export type FineInput = {
  playerIds: string[];
  date: string;
  concept: string;
  amount: number;
};

// ── Próximo partido (5.1) ─────────────────────────────────────────
export type NextMatchInput = {
  matchday: number | null;
  date: string | null; // yyyy-mm-dd
  time: string | null;
  opponent: string | null;
  place: string | null;
  isHome: boolean;
};

// ── Clasificación oficial (5.2) ───────────────────────────────────
export type StandingInput = {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

// ── Propuestas (9) ────────────────────────────────────────────────
export type ProposalStatus =
  | "PENDIENTE"
  | "EN_REVISION"
  | "ACEPTADA"
  | "RECHAZADA";

// ── Jugador del Mes ──
export type PollStatus = "OPEN" | "CLOSED" | "CANCELLED";

export type CreatePollInput = {
  activityId: string;
  allowSelfVote: boolean;
  candidateIds: string[];
  closesAt: string | null; // datetime-local (opcional; si no, martes 23:59)
};

export type BallotInput = {
  pollId: string;
  firstId: string; // 3 puntos
  secondId: string; // 2 puntos
  thirdId: string; // 1 punto
};

// Categorías de documento del equipo (Régimen Interno / Grupos de Material).
export type DocKind = "REGIMEN_INTERNO" | "GRUPOS_MATERIAL";
