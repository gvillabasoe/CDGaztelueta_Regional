"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { saveExerciseRatings } from "@/actions/rating";
import type { ExerciseRatingInput } from "@/lib/types";

export function RateExercises({
  exercises,
  initialRatings,
}: {
  exercises: { id: string; task: string }[];
  initialRatings: Record<string, number>;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const e of exercises)
      v[e.id] = initialRatings[e.id] != null ? String(initialRatings[e.id]) : "";
    return v;
  });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const ratings: ExerciseRatingInput[] = [];
    for (const e of exercises) {
      const s = values[e.id];
      if (!s || !s.trim()) continue;
      const n = parseFloat(s.replace(",", "."));
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        setBusy(false);
        setMsg(`La valoración de "${e.task}" debe estar entre 1 y 10.`);
        return;
      }
      ratings.push({ exerciseId: e.id, rating: n });
    }
    const res = await saveExerciseRatings(ratings);
    setBusy(false);
    setMsg(res.ok ? "Valoraciones guardadas." : res.error);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-3">
      {exercises.map((e, i) => (
        <div
          key={e.id}
          className="flex items-center gap-3 rounded-xl border border-gris/20 p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-negro">
              {i + 1}. {e.task}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Star size={15} className="text-dorado" />
            <input
              type="number"
              min={1}
              max={10}
              step={0.1}
              inputMode="decimal"
              className="field w-20 text-center"
              placeholder="1–10"
              value={values[e.id] ?? ""}
              onChange={(ev) =>
                setValues((v) => ({ ...v, [e.id]: ev.target.value }))
              }
            />
          </div>
        </div>
      ))}
      {msg && <p className="rounded-lg bg-beige px-3 py-2 text-sm">{msg}</p>}
      <button className="btn-primary w-full" onClick={save} disabled={busy}>
        {busy && <Loader2 size={16} className="animate-spin" />} Guardar
        valoraciones
      </button>
    </div>
  );
}
