"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  FileText,
  Upload,
  Trash2,
  Loader2,
  Coins,
} from "lucide-react";
import {
  uploadExerciseFile,
  deleteExerciseFile,
} from "@/actions/activity";
import { assignExercisePoints } from "@/actions/league";

type Entry = { playerId: string; points: number; note: string | null };
type Ex = {
  id: string;
  task: string;
  scorable: boolean;
  maxPoints: number | null;
  hasFile: boolean;
  fileName: string | null;
};
type P = { id: string; name: string };

function fileToB64(
  file: File,
): Promise<{ name: string; mime: string; dataBase64: string }> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () =>
      res({
        name: file.name,
        mime: file.type || "application/octet-stream",
        dataBase64: String(r.result).split(",")[1] || "",
      });
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function ScoringManager({
  exercises,
  roster,
  entriesByExercise,
}: {
  exercises: Ex[];
  roster: P[];
  entriesByExercise: Record<string, Entry[]>;
}) {
  const [onlyScorable, setOnlyScorable] = React.useState(false);
  const scorableCount = exercises.filter((e) => e.scorable).length;
  const shown = onlyScorable ? exercises.filter((e) => e.scorable) : exercises;

  if (exercises.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gris">
          Total: {exercises.length} · Puntuables: {scorableCount}
        </p>
        {scorableCount > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => setOnlyScorable(false)}
              className={
                "chip border " +
                (!onlyScorable
                  ? "border-marino bg-marino text-blanco"
                  : "border-gris/30 bg-blanco text-negro")
              }
            >
              Todos
            </button>
            <button
              onClick={() => setOnlyScorable(true)}
              className={
                "chip border " +
                (onlyScorable
                  ? "border-marino bg-marino text-blanco"
                  : "border-gris/30 bg-blanco text-negro")
              }
            >
              Solo puntuables
            </button>
          </div>
        )}
      </div>

      {shown.map((e) => (
        <ExerciseCard
          key={e.id}
          ex={e}
          roster={roster}
          entries={entriesByExercise[e.id] ?? []}
        />
      ))}
    </div>
  );
}

function ExerciseCard({
  ex,
  roster,
  entries,
}: {
  ex: Ex;
  roster: P[];
  entries: Entry[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    const payload = await fileToB64(file);
    await uploadExerciseFile(ex.id, payload);
    setBusy(false);
    router.refresh();
  }
  async function removeFile() {
    if (!confirm("¿Eliminar el archivo de este ejercicio?")) return;
    setBusy(true);
    await deleteExerciseFile(ex.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      className={
        "rounded-xl border p-3 " +
        (ex.scorable ? "border-dorado bg-dorado/5" : "border-gris/20")
      }
    >
      <p className="flex items-center gap-1.5 font-medium text-negro">
        {ex.scorable && <Trophy size={15} className="text-dorado" />}
        {ex.task}
      </p>

      {/* Adjunto */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {ex.hasFile ? (
          <>
            <a
              href={`/api/exercise-file/${ex.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-marino underline"
            >
              <FileText size={13} /> {ex.fileName || "Archivo"}
            </a>
            <button
              onClick={removeFile}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 disabled:opacity-50"
            >
              <Trash2 size={12} /> Quitar
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-gris/30 px-2 py-1 text-xs font-semibold text-marino disabled:opacity-50"
            >
              <Upload size={12} /> Sustituir
            </button>
          </>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-gris/30 px-2 py-1 text-xs font-semibold text-marino disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Upload size={12} />
            )}
            Adjuntar documento o imagen
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>

      {ex.scorable && <AssignPanel ex={ex} roster={roster} entries={entries} />}
    </div>
  );
}

function AssignPanel({
  ex,
  roster,
  entries,
}: {
  ex: Ex;
  roster: P[];
  entries: Entry[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const existing = new Map(entries.map((e) => [e.playerId, e]));
  const [rows, setRows] = React.useState<
    Record<string, { points: string; note: string }>
  >(() =>
    Object.fromEntries(
      roster.map((p) => {
        const ex0 = existing.get(p.id);
        return [
          p.id,
          {
            points: ex0 ? String(ex0.points) : "",
            note: ex0?.note ?? "",
          },
        ];
      }),
    ),
  );

  const assignedCount = entries.length;

  async function save() {
    setBusy(true);
    setMsg(null);
    const payload = roster
      .map((p) => ({
        playerId: p.id,
        raw: rows[p.id]?.points ?? "",
        note: rows[p.id]?.note ?? "",
      }))
      .filter((r) => r.raw.trim() !== "" && Number.isFinite(Number(r.raw)))
      .map((r) => ({
        playerId: r.playerId,
        points: parseInt(r.raw, 10),
        note: r.note.trim() || null,
      }));
    const res = await assignExercisePoints(ex.id, payload);
    setBusy(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-marino px-3 py-1.5 text-xs font-semibold text-blanco"
      >
        <Coins size={13} /> Asignar puntos
        {assignedCount > 0 ? ` (${assignedCount} asignados)` : ""}
      </button>
    );

  return (
    <div className="mt-3 rounded-lg border border-marino/20 bg-blanco p-2">
      <p className="mb-2 text-xs font-bold uppercase text-marino">
        Asignar puntos de liga
        {ex.maxPoints != null ? ` · máx. ${ex.maxPoints}` : ""}
      </p>
      <div className="max-h-72 space-y-1.5 overflow-y-auto">
        {roster.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
            <input
              inputMode="numeric"
              placeholder="pts"
              className="field w-16 py-1 text-center"
              value={rows[p.id]?.points ?? ""}
              onChange={(e) =>
                setRows((r) => ({
                  ...r,
                  [p.id]: { ...r[p.id], points: e.target.value },
                }))
              }
            />
            <input
              placeholder="obs. (opcional)"
              className="field w-28 py-1 text-xs"
              value={rows[p.id]?.note ?? ""}
              onChange={(e) =>
                setRows((r) => ({
                  ...r,
                  [p.id]: { ...r[p.id], note: e.target.value },
                }))
              }
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-gris">
        Se permiten puntos positivos y negativos. Reeditar sustituye el valor
        anterior (no se suma dos veces). Deja en blanco para no cambiar.
      </p>
      {msg && (
        <p className="mt-1 rounded bg-amarillo/25 px-2 py-1 text-xs">{msg}</p>
      )}
      <div className="mt-2 flex gap-2">
        <button className="btn-primary flex-1" onClick={save} disabled={busy}>
          {busy && <Loader2 size={14} className="animate-spin" />} Confirmar
        </button>
        <button className="btn-ghost" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
