"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  Paperclip,
  CalendarDays,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { Switch } from "@/components/Switch";
import { DAY_NAMES, dateToIsoWeek } from "@/lib/week";
import { savePlan, updatePlan } from "@/actions/plan";
import type { PlanInput, PlayerLite } from "@/lib/types";

type ExerciseState = {
  uid: string;
  id?: string;
  task: string;
  description: string;
  objective: string;
  duration: string;
};
type TrainingState = {
  uid: string;
  id?: string;
  dayOfWeek: number;
  time: string;
  exercises: ExerciseState[];
};
type MatchState = {
  date: string;
  place: string;
  time: string;
  callTime: string;
  kitLocal: boolean;
  calledPlayerIds: string[];
};

export type PlanEditorInitial = {
  week: string;
  fileName: string | null;
  trainings: {
    id: string;
    dayOfWeek: number;
    time: string;
    exercises: {
      id: string;
      task: string;
      description: string | null;
      objective: string | null;
      duration: string | null;
    }[];
  }[];
  match: {
    date: string | null;
    place: string | null;
    time: string | null;
    callTime: string | null;
    kitLocal: boolean;
    calledPlayerIds: string[];
  };
};

let uidCounter = 0;
function uid() {
  uidCounter += 1;
  return `u${Date.now()}_${uidCounter}`;
}

function playerName(p: PlayerLite) {
  return p.nickname?.trim() || `${p.firstName} ${p.lastName}`;
}

export function PlanEditor({
  players,
  initial,
  planId,
}: {
  players: PlayerLite[];
  initial?: PlanEditorInitial;
  planId?: string;
}) {
  const router = useRouter();

  const [week, setWeek] = useState(initial?.week ?? dateToIsoWeek(new Date()));
  const [trainings, setTrainings] = useState<TrainingState[]>(
    initial
      ? initial.trainings.map((t) => ({
          uid: uid(),
          id: t.id,
          dayOfWeek: t.dayOfWeek,
          time: t.time,
          exercises: t.exercises.map((e) => ({
            uid: uid(),
            id: e.id,
            task: e.task,
            description: e.description ?? "",
            objective: e.objective ?? "",
            duration: e.duration ?? "",
          })),
        }))
      : [],
  );
  const [match, setMatch] = useState<MatchState>({
    date: initial?.match.date ?? "",
    place: initial?.match.place ?? "",
    time: initial?.match.time ?? "",
    callTime: initial?.match.callTime ?? "",
    kitLocal: initial?.match.kitLocal ?? true,
    calledPlayerIds: initial?.match.calledPlayerIds ?? [],
  });
  const [fileNew, setFileNew] = useState<PlanInput["file"]>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // ── Entrenamientos ──
  function addTraining() {
    setTrainings((prev) => [
      ...prev,
      {
        uid: uid(),
        dayOfWeek: 1,
        time: "18:00",
        exercises: [
          { uid: uid(), task: "", description: "", objective: "", duration: "" },
        ],
      },
    ]);
  }
  function removeTraining(ti: number) {
    setTrainings((prev) => prev.filter((_, i) => i !== ti));
  }
  function patchTraining(ti: number, patch: Partial<TrainingState>) {
    setTrainings((prev) =>
      prev.map((t, i) => (i === ti ? { ...t, ...patch } : t)),
    );
  }
  function addExercise(ti: number) {
    setTrainings((prev) =>
      prev.map((t, i) =>
        i === ti
          ? {
              ...t,
              exercises: [
                ...t.exercises,
                {
                  uid: uid(),
                  task: "",
                  description: "",
                  objective: "",
                  duration: "",
                },
              ],
            }
          : t,
      ),
    );
  }
  function removeExercise(ti: number, ei: number) {
    setTrainings((prev) =>
      prev.map((t, i) =>
        i === ti
          ? { ...t, exercises: t.exercises.filter((_, j) => j !== ei) }
          : t,
      ),
    );
  }
  function patchExercise(
    ti: number,
    ei: number,
    patch: Partial<ExerciseState>,
  ) {
    setTrainings((prev) =>
      prev.map((t, i) =>
        i === ti
          ? {
              ...t,
              exercises: t.exercises.map((e, j) =>
                j === ei ? { ...e, ...patch } : e,
              ),
            }
          : t,
      ),
    );
  }

  // ── Archivo ──
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setFileNew({
        name: f.name,
        mime: f.type || "application/octet-stream",
        dataBase64: base64,
      });
    };
    reader.readAsDataURL(f);
  }

  // ── Convocatoria (máx. 18) ──
  const atMax = match.calledPlayerIds.length >= 18;
  function toggleCalled(id: string) {
    setMatch((m) => {
      const has = m.calledPlayerIds.includes(id);
      if (has)
        return {
          ...m,
          calledPlayerIds: m.calledPlayerIds.filter((x) => x !== id),
        };
      if (m.calledPlayerIds.length >= 18) return m;
      return { ...m, calledPlayerIds: [...m.calledPlayerIds, id] };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: PlanInput = {
      week,
      trainings: trainings.map((t) => ({
        id: t.id,
        dayOfWeek: t.dayOfWeek,
        time: t.time,
        exercises: t.exercises.map((ex) => ({
          id: ex.id,
          task: ex.task,
          description: ex.description || null,
          objective: ex.objective || null,
          duration: ex.duration || null,
        })),
      })),
      match: {
        date: match.date || null,
        place: match.place || null,
        time: match.time || null,
        callTime: match.callTime || null,
        kitLocal: match.kitLocal,
        calledPlayerIds: match.calledPlayerIds,
      },
      file: fileNew,
    };

    const res = planId
      ? await updatePlan(planId, input)
      : await savePlan(input);
    setSaving(false);
    if (res.ok) {
      router.push("/coach/registro");
      router.refresh();
    } else {
      setError(res.error || "No se ha podido guardar la planificación.");
    }
  }

  const currentFileName = fileNew?.name ?? initial?.fileName ?? null;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Semana */}
      <div className="card space-y-2 p-4">
        <label className="label" htmlFor="semana">
          Semana a planificar
        </label>
        <input
          id="semana"
          type="week"
          className="field"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          required
        />
      </div>

      {/* Entrenamientos */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell size={16} className="text-marino" />
          <p className="eyebrow">Entrenamientos</p>
        </div>

        {trainings.length === 0 && (
          <p className="card p-4 text-center text-sm text-gris">
            Aún no has añadido entrenamientos.
          </p>
        )}

        {trainings.map((t, ti) => (
          <div key={t.uid} className="card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gris">
                Entrenamiento {ti + 1}
              </span>
              <button
                type="button"
                onClick={() => removeTraining(ti)}
                className="rounded-lg p-1.5 text-gris hover:bg-blanco hover:text-marino"
                aria-label="Eliminar entrenamiento"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="label">Día de la semana</span>
                <select
                  className="field"
                  value={t.dayOfWeek}
                  onChange={(e) =>
                    patchTraining(ti, { dayOfWeek: Number(e.target.value) })
                  }
                >
                  {DAY_NAMES.map((d, idx) => (
                    <option key={idx} value={idx + 1}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label">Hora</span>
                <input
                  type="time"
                  className="field"
                  value={t.time}
                  onChange={(e) => patchTraining(ti, { time: e.target.value })}
                />
              </div>
            </div>

            {/* Ejercicios */}
            <div className="space-y-3 rounded-xl bg-beige/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gris">
                Ejercicios
              </p>
              {t.exercises.map((ex, ei) => (
                <div
                  key={ex.uid}
                  className="space-y-2 rounded-lg border border-gris/20 bg-blanco p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gris">
                      Ejercicio {ei + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExercise(ti, ei)}
                      className="rounded-lg p-1 text-gris hover:text-marino"
                      aria-label="Eliminar ejercicio"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div>
                    <span className="label">Tarea</span>
                    <input
                      className="field"
                      value={ex.task}
                      onChange={(e) =>
                        patchExercise(ti, ei, { task: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <span className="label">Descripción de la tarea</span>
                    <textarea
                      className="field min-h-[56px] resize-y"
                      value={ex.description}
                      onChange={(e) =>
                        patchExercise(ti, ei, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="label">Objetivo</span>
                      <input
                        className="field"
                        value={ex.objective}
                        onChange={(e) =>
                          patchExercise(ti, ei, { objective: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <span className="label">Duración</span>
                      <input
                        className="field"
                        placeholder="Ej. 15 min"
                        value={ex.duration}
                        onChange={(e) =>
                          patchExercise(ti, ei, { duration: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => addExercise(ti)}
              >
                <Plus size={16} /> Añadir ejercicio
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn-gold w-full"
          onClick={addTraining}
        >
          <Plus size={18} /> Añadir entrenamiento
        </button>
      </section>

      {/* Archivo */}
      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-marino" />
          <p className="eyebrow">Archivo</p>
        </div>
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip size={16} /> Subir archivo
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={onPickFile}
        />
        {currentFileName ? (
          <p className="text-sm text-marino">
            Archivo: <span className="font-medium">{currentFileName}</span>
            {!fileNew && planId && initial?.fileName && (
              <>
                {" · "}
                <a
                  href={`/api/plan-file/${planId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-marino underline"
                >
                  Ver
                </a>
              </>
            )}
          </p>
        ) : (
          <p className="text-sm text-gris">No hay ningún archivo adjunto.</p>
        )}
      </section>

      {/* Ficha del partido */}
      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-marino" />
          <p className="eyebrow">Ficha del partido</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="label">Fecha</span>
            <input
              type="date"
              className="field"
              value={match.date}
              onChange={(e) => setMatch({ ...match, date: e.target.value })}
            />
          </div>
          <div>
            <span className="label">Lugar</span>
            <input
              className="field"
              value={match.place}
              onChange={(e) => setMatch({ ...match, place: e.target.value })}
            />
          </div>
          <div>
            <span className="label">Hora</span>
            <input
              type="time"
              className="field"
              value={match.time}
              onChange={(e) => setMatch({ ...match, time: e.target.value })}
            />
          </div>
          <div>
            <span className="label">Hora de convocatoria</span>
            <input
              type="time"
              className="field"
              value={match.callTime}
              onChange={(e) =>
                setMatch({ ...match, callTime: e.target.value })
              }
            />
          </div>
        </div>

        {/* Equipación */}
        <div className="flex items-center justify-between rounded-xl bg-beige/50 px-3 py-2.5">
          <span className="text-sm font-medium text-marino">Equipación</span>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={
                !match.kitLocal ? "font-semibold text-marino" : "text-gris"
              }
            >
              Visitante
            </span>
            <Switch
              checked={match.kitLocal}
              onChange={(v) => setMatch({ ...match, kitLocal: v })}
              label="Equipación local o visitante"
            />
            <span
              className={
                match.kitLocal ? "font-semibold text-marino" : "text-gris"
              }
            >
              Local
            </span>
          </div>
        </div>

        {/* Convocatoria */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label mb-0">Convocatoria</span>
            <span
              className={
                "text-xs font-semibold " +
                (atMax ? "text-dorado" : "text-gris")
              }
            >
              {match.calledPlayerIds.length}/18
            </span>
          </div>
          {players.length === 0 ? (
            <p className="text-sm text-gris">Aún no hay jugadores.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const selected = match.calledPlayerIds.includes(p.id);
                const disabled = !selected && atMax;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleCalled(p.id)}
                    className={
                      "chip border transition " +
                      (selected
                        ? "border-marino bg-marino text-beige"
                        : disabled
                          ? "border-gris/20 bg-blanco text-gris/50"
                          : "border-gris/30 bg-blanco text-marino")
                    }
                  >
                    {playerName(p)}
                  </button>
                );
              })}
            </div>
          )}
          {atMax && (
            <p className="mt-2 text-xs text-gris">
              Has alcanzado el máximo de 18 jugadores convocados.
            </p>
          )}
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <CalendarDays size={18} />
        )}
        {saving ? "Guardando…" : "Guardar planificación"}
      </button>
    </form>
  );
}
