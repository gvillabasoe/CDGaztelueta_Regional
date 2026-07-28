"use client";

import * as React from "react";
import { useState } from "react";
import { Dumbbell, Goal } from "lucide-react";
import { TrainingForm } from "./TrainingForm";
import { MatchForm } from "./MatchForm";
import type { PlayerLite } from "@/lib/types";

type Mode = "entrenamiento" | "partido";

export function RegistroClient({
  players,
  today,
}: {
  players: PlayerLite[];
  today: string;
}) {
  const [mode, setMode] = useState<Mode>("entrenamiento");

  return (
    <div className="space-y-5">
      <p className="eyebrow">Registro</p>

      <div className="grid grid-cols-2 gap-3">
        <ChoiceCard
          active={mode === "entrenamiento"}
          onClick={() => setMode("entrenamiento")}
          icon={<Dumbbell size={22} />}
          label="Entrenamiento"
        />
        <ChoiceCard
          active={mode === "partido"}
          onClick={() => setMode("partido")}
          icon={<Goal size={22} />}
          label="Partido"
        />
      </div>

      {mode === "entrenamiento" ? (
        <TrainingForm players={players} today={today} />
      ) : (
        <MatchForm players={players} today={today} />
      )}
    </div>
  );
}

function ChoiceCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 font-semibold transition " +
        (active
          ? "border-marino bg-marino text-beige"
          : "border-transparent bg-blanco text-marino shadow-card")
      }
    >
      <span
        className={
          "flex h-11 w-11 items-center justify-center rounded-full " +
          (active ? "bg-dorado/25 text-beige" : "bg-beige text-marino")
        }
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
