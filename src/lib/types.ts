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
