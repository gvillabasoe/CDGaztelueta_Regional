// Tipos compartidos entre formularios (cliente) y acciones (servidor).

export type PlayerLite = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  number: number | null;
  positions: string[];
};

export type FineInput = {
  playerIds: string[];
  amount: number;
  reason: string;
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
  date: string;
  plannedTrainingId?: string | null;
  players: TrainingPlayerInput[];
  fines: FineInput[];
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
  fines: FineInput[];
};

export type CreatePlayerInput = {
  firstName: string;
  lastName: string;
  nickname: string | null;
  number: number | null;
  age: number | null;
  isCaptain: boolean;
  positions: string[];
  photo: string | null;
  username: string;
  password: string;
};

// ── Planificación semanal ─────────────────────────────────────────

export type PlanExerciseInput = {
  id?: string; // presente al editar
  task: string;
  description: string | null;
  objective: string | null;
  duration: string | null;
};

export type PlanTrainingInput = {
  id?: string; // presente al editar
  dayOfWeek: number; // 1..7
  time: string; // "HH:MM"
  exercises: PlanExerciseInput[];
};

export type PlanMatchInput = {
  date: string | null; // "yyyy-mm-dd"
  place: string | null;
  time: string | null; // "HH:MM"
  callTime: string | null; // "HH:MM"
  kitLocal: boolean; // true = Local, false = Visitante
  calledPlayerIds: string[]; // máx. 18
};

export type PlanFileInput = {
  name: string;
  mime: string;
  dataBase64: string; // base64 sin el prefijo "data:...;base64,"
};

export type PlanInput = {
  week: string; // "YYYY-Www"
  trainings: PlanTrainingInput[];
  match: PlanMatchInput;
  file: PlanFileInput | null; // null = no cambiar / no adjuntar
};

// ── Valoración de ejercicios por el jugador ───────────────────────

export type ExerciseRatingInput = {
  exerciseId: string;
  rating: number; // 1..10
};
