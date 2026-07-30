"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ABSENCE_REASONS, ABSENCE_LABEL } from "@/lib/labels";
import { setMyAttendance, setPlayerAttendance } from "@/actions/attendance";

type Status = "GOING" | "NOT_GOING";
type AP = {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  status: Status;
  reason: string | null;
  explanation: string | null;
};

export function AttendancePanel({
  activityId,
  isCoach,
  myPlayerId,
  players,
}: {
  activityId: string;
  isCoach: boolean;
  myPlayerId: string | null;
  players: AP[];
}) {
  const router = useRouter();
  const going = players.filter((p) => p.status === "GOING").length;
  const notGoing = players.length - going;

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <span className="chip bg-green-100 text-green-700">
          {going} asistirán
        </span>
        <span className="chip bg-red-100 text-red-700">{notGoing} no asistirán</span>
      </div>
      <div className="space-y-2">
        {players.map((p) => (
          <Row
            key={p.id}
            p={p}
            editable={isCoach || p.id === myPlayerId}
            onSave={async (status, reason, explanation) => {
              const res =
                isCoach
                  ? await setPlayerAttendance(
                      activityId,
                      p.id,
                      status,
                      reason,
                      explanation,
                    )
                  : await setMyAttendance(
                      activityId,
                      status,
                      reason,
                      explanation,
                    );
              if (!res.ok) return res.error;
              router.refresh();
              return null;
            }}
          />
        ))}
        {players.length === 0 && (
          <p className="text-sm text-gris">Sin jugadores en la plantilla.</p>
        )}
      </div>
    </div>
  );
}

function Row({
  p,
  editable,
  onSave,
}: {
  p: AP;
  editable: boolean;
  onSave: (
    status: "GOING" | "NOT_GOING",
    reason: string | null,
    explanation: string | null,
  ) => Promise<string | null>;
}) {
  const [mode, setMode] = React.useState<"idle" | "absence">("idle");
  const [reason, setReason] = React.useState(p.reason ?? "LESION");
  const [explanation, setExplanation] = React.useState(p.explanation ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const err = await onSave("GOING", null, null);
    setBusy(false);
    if (err) setError(err);
  }
  async function confirmAbsence() {
    setBusy(true);
    setError(null);
    const err = await onSave("NOT_GOING", reason, explanation);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setMode("idle");
  }

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <PlayerAvatar
          photo={p.photo}
          firstName={p.firstName}
          lastName={p.lastName}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-negro">
            {p.firstName} {p.lastName}
          </p>
          {p.status === "NOT_GOING" && p.reason && mode === "idle" && (
            <p className="truncate text-xs text-gris">
              {ABSENCE_LABEL[p.reason] ?? p.reason}
              {p.explanation ? ` · ${p.explanation}` : ""}
            </p>
          )}
        </div>

        {mode === "idle" &&
          (editable ? (
            <div className="flex shrink-0 gap-1">
              <button
                onClick={go}
                disabled={busy}
                className={
                  "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
                  (p.status === "GOING"
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100")
                }
              >
                {busy && p.status !== "GOING" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Sí
              </button>
              <button
                onClick={() => setMode("absence")}
                disabled={busy}
                className={
                  "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
                  (p.status === "NOT_GOING"
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100")
                }
              >
                <X size={13} />
                No
              </button>
            </div>
          ) : (
            <span
              className={
                "shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold " +
                (p.status === "GOING"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700")
              }
            >
              {p.status === "GOING" ? "Sí, asistirá" : "No asistirá"}
            </span>
          ))}
      </div>

      {mode === "absence" && (
        <div className="mt-3 space-y-2 border-t border-gris/10 pt-3">
          <div>
            <label className="label">Motivo de la ausencia</label>
            <select
              className="field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {ABSENCE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {ABSENCE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Explicación</label>
            <textarea
              className="field"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Breve explicación (obligatoria)"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-amarillo/25 px-3 py-1.5 text-xs">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 py-2 text-xs"
              onClick={confirmAbsence}
              disabled={busy}
            >
              {busy && <Loader2 size={13} className="animate-spin" />} Confirmar
              ausencia
            </button>
            <button
              className="btn-ghost py-2 text-xs"
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
              disabled={busy}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
