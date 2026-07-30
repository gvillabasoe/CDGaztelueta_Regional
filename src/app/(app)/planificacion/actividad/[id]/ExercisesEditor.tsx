"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save } from "lucide-react";
import { saveExercises } from "@/actions/activity";
import type { ExerciseInput } from "@/lib/types";

type Draft = {
  key: string;
  id?: string;
  task: string;
  description: string;
  objective: string;
  duration: string;
};

let c = 0;
const uid = () => `e${Date.now()}_${c++}`;

export function ExercisesEditor({
  activityId,
  initial,
}: {
  activityId: string;
  initial: ExerciseInput[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = React.useState<Draft[]>(
    initial.map((e) => ({
      key: uid(),
      id: e.id,
      task: e.task,
      description: e.description ?? "",
      objective: e.objective ?? "",
      duration: e.duration ?? "",
    })),
  );
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  function add() {
    setDrafts((d) => [
      ...d,
      { key: uid(), task: "", description: "", objective: "", duration: "" },
    ]);
  }
  function patch(key: string, p: Partial<Draft>) {
    setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...p } : x)));
  }
  function remove(key: string) {
    setDrafts((d) => d.filter((x) => x.key !== key));
  }
  function move(i: number, dir: -1 | 1) {
    setDrafts((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const copy = [...d];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const payload: ExerciseInput[] = drafts
      .filter((d) => d.task.trim())
      .map((d) => ({
        id: d.id,
        task: d.task.trim(),
        description: d.description.trim() || null,
        objective: d.objective.trim() || null,
        duration: d.duration.trim() || null,
      }));
    const res = await saveExercises(activityId, payload);
    setSaving(false);
    setMsg(res.ok ? "Ejercicios guardados." : res.error);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-3">
      {drafts.map((d, i) => (
        <div key={d.key} className="rounded-xl border border-gris/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-gris">Ejercicio {i + 1}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded p-1 text-marino hover:bg-marino/10 disabled:opacity-30"
                aria-label="Subir"
              >
                <ChevronUp size={15} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === drafts.length - 1}
                className="rounded p-1 text-marino hover:bg-marino/10 disabled:opacity-30"
                aria-label="Bajar"
              >
                <ChevronDown size={15} />
              </button>
              <button
                onClick={() => remove(d.key)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
                aria-label="Eliminar ejercicio"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <input
              className="field"
              placeholder="Tarea o nombre del ejercicio *"
              value={d.task}
              onChange={(e) => patch(d.key, { task: e.target.value })}
            />
            <textarea
              className="field"
              rows={2}
              placeholder="Descripción (opcional)"
              value={d.description}
              onChange={(e) => patch(d.key, { description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="field"
                placeholder="Objetivo (opcional)"
                value={d.objective}
                onChange={(e) => patch(d.key, { objective: e.target.value })}
              />
              <input
                className="field"
                placeholder="Duración (opcional)"
                value={d.duration}
                onChange={(e) => patch(d.key, { duration: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      <button className="btn-ghost w-full" onClick={add}>
        <Plus size={16} /> Añadir ejercicio
      </button>

      {msg && <p className="rounded-lg bg-beige px-3 py-2 text-sm">{msg}</p>}

      <button className="btn-primary w-full" onClick={save} disabled={saving}>
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Guardar ejercicios
      </button>
    </div>
  );
}
