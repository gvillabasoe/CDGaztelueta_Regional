"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Save } from "lucide-react";
import { saveExerciseRatings } from "@/actions/rating";

type Exercise = {
  id: string;
  task: string;
  description: string | null;
  objective: string | null;
  duration: string | null;
};

export function RateExercises({
  exercises,
  initialRatings,
}: {
  exercises: Exercise[];
  initialRatings: Record<string, number>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const e of exercises) {
      v[e.id] =
        initialRatings[e.id] !== undefined ? String(initialRatings[e.id]) : "";
    }
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setError(null);
    setDone(false);

    const ratings = exercises
      .map((e) => ({ exerciseId: e.id, rating: parseFloat(values[e.id]) }))
      .filter((r) => !Number.isNaN(r.rating));

    const outOfRange = ratings.find((r) => r.rating < 1 || r.rating > 10);
    if (outOfRange) {
      setSaving(false);
      setError("Cada valoración debe estar entre 1 y 10.");
      return;
    }

    const res = await saveExerciseRatings(ratings);
    setSaving(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      setError(res.error || "No se han podido guardar las valoraciones.");
    }
  }

  return (
    <div className="space-y-3">
      {exercises.map((e, i) => (
        <div key={e.id} className="card space-y-2 p-4">
          <p className="text-sm font-semibold text-marino">
            {e.task || `Ejercicio ${i + 1}`}
          </p>
          {e.description && (
            <p className="text-xs text-gris">{e.description}</p>
          )}
          {(e.objective || e.duration) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gris">
              {e.objective && (
                <p>
                  <span className="font-semibold">Objetivo:</span> {e.objective}
                </p>
              )}
              {e.duration && (
                <p>
                  <span className="font-semibold">Duración:</span> {e.duration}
                </p>
              )}
            </div>
          )}
          <div>
            <span className="label">Tu valoración (1-10)</span>
            <input
              type="number"
              min="1"
              max="10"
              step="0.1"
              inputMode="decimal"
              className="field"
              value={values[e.id] ?? ""}
              onChange={(ev) =>
                setValues((v) => ({ ...v, [e.id]: ev.target.value }))
              }
            />
          </div>
        </div>
      ))}

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : done ? (
          <Check size={18} />
        ) : (
          <Save size={18} />
        )}
        {saving
          ? "Guardando…"
          : done
            ? "Valoraciones guardadas"
            : "Guardar valoraciones"}
      </button>
    </div>
  );
}
