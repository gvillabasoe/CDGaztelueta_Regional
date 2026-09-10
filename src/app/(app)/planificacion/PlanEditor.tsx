"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Dumbbell,
  Trophy,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Switch } from "@/components/Switch";
import { isoWeekToMonday } from "@/lib/week";
import { savePlan, updatePlan } from "@/actions/plan";
import type { PlanActivityInput, PlanInput, PlayerLite } from "@/lib/types";

type Draft = {
  key: string;
  id?: string;
  type: "TRAINING" | "MATCH" | "DINNER";
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  opponent: string;
  matchday: string;
  callTime: string;
  kitLocal: boolean;
  calledPlayerIds: string[];
  dinnerPlace: string;
  afterPlace: string;
  notes: string;
  pollEnabled: boolean;
};

let counter = 0;
const uid = () => `a${Date.now()}_${counter++}`;

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PlanEditor({
  mode,
  planId,
  players,
  initialWeek,
  initialPublished,
  initialActivities,
}: {
  mode: "create" | "edit";
  planId?: string;
  players: PlayerLite[];
  initialWeek: string;
  initialPublished?: boolean;
  initialActivities?: PlanActivityInput[];
}) {
  const router = useRouter();
  const [week, setWeek] = React.useState(initialWeek);
  const [published, setPublished] = React.useState(initialPublished ?? false);
  const [openConv, setOpenConv] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [drafts, setDrafts] = React.useState<Draft[]>(
    (initialActivities ?? []).map((a) => ({
      key: uid(),
      id: a.id,
      type: a.type,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime ?? "",
      place: a.place ?? "",
      opponent: a.opponent ?? "",
      matchday: a.matchday != null ? String(a.matchday) : "",
      callTime: a.callTime ?? "",
      kitLocal: a.kitLocal ?? true,
      calledPlayerIds: a.calledPlayerIds ?? [],
      dinnerPlace: a.dinnerPlace ?? "",
      afterPlace: a.afterPlace ?? "",
      notes: a.notes ?? "",
      pollEnabled: a.pollEnabled ?? false,
    })),
  );

  function defaultDate() {
    const monday = isoWeekToMonday(week);
    return monday ? toIsoDate(monday) : "";
  }

  function add(type: "TRAINING" | "MATCH" | "DINNER") {
    setDrafts((d) => [
      ...d,
      {
        key: uid(),
        type,
        date: defaultDate(),
        startTime:
          type === "MATCH" ? "17:00" : type === "DINNER" ? "21:30" : "20:30",
        endTime: "",
        place: "",
        opponent: "",
        matchday: "",
        callTime: "",
        kitLocal: true,
        calledPlayerIds: [],
        dinnerPlace: "",
        afterPlace: "",
        notes: "",
        pollEnabled: false,
      },
    ]);
  }

  function patch(key: string, p: Partial<Draft>) {
    setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...p } : x)));
  }
  function remove(key: string) {
    setDrafts((d) => d.filter((x) => x.key !== key));
  }
  function toggleCalled(key: string, pid: string) {
    setDrafts((d) =>
      d.map((x) => {
        if (x.key !== key) return x;
        const has = x.calledPlayerIds.includes(pid);
        if (has)
          return {
            ...x,
            calledPlayerIds: x.calledPlayerIds.filter((i) => i !== pid),
          };
        if (x.calledPlayerIds.length >= 18) return x; // tope de 18
        return { ...x, calledPlayerIds: [...x.calledPlayerIds, pid] };
      }),
    );
  }

  async function save() {
    setError(null);
    if (!isoWeekToMonday(week)) {
      setError("Selecciona una semana.");
      return;
    }
    for (const d of drafts) {
      if (!d.date) {
        setError("Todas las actividades necesitan una fecha.");
        return;
      }
      if (d.type === "DINNER" && !d.dinnerPlace.trim()) {
        setMsg("Indica el lugar de la cena.");
        return;
      }
      if (d.type === "MATCH" && d.calledPlayerIds.length > 18) {
        setError("La convocatoria no puede superar los 18 jugadores.");
        return;
      }
    }

    const payload: PlanInput = {
      week,
      published,
      activities: drafts.map((d) => ({
        id: d.id,
        type: d.type,
        date: d.date,
        startTime: d.startTime || "00:00",
        endTime: d.endTime || null,
        place: d.place.trim() || null,
        opponent: d.type === "MATCH" ? d.opponent.trim() || null : null,
        matchday:
          d.type === "MATCH" && d.matchday.trim()
            ? parseInt(d.matchday, 10)
            : null,
        callTime:
          d.type === "MATCH" || d.type === "DINNER" ? d.callTime || null : null,
        kitLocal: d.type === "MATCH" ? d.kitLocal : null,
        calledPlayerIds:
          d.type === "MATCH" || d.type === "DINNER" ? d.calledPlayerIds : [],
        dinnerPlace: d.type === "DINNER" ? d.dinnerPlace.trim() || null : null,
        afterPlace: d.type === "DINNER" ? d.afterPlace.trim() || null : null,
        notes: d.type === "DINNER" ? d.notes.trim() || null : null,
        pollEnabled: d.type === "DINNER" ? d.pollEnabled : false,
      })),
    };

    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res =
        mode === "create"
          ? await savePlan(payload)
          : await updatePlan(planId!, payload);
      if (!res.ok) {
        // Se conserva el formulario y los datos introducidos.
        setError(res.error);
        return;
      }
      setMsg("Cambios guardados y publicados.");
      // Los jugadores ven los cambios sin reconstruir la semana.
      router.push("/planificacion");
      router.refresh();
    } catch (e) {
      console.error("guardar planificación", e);
      setError("No se han podido guardar los cambios. Inténtalo de nuevo.");
    } finally {
      // El estado de carga finaliza SIEMPRE, en éxito y en error.
      setSaving(false);
    }
  }

  const label = (p: PlayerLite) =>
    `${p.number != null ? "#" + p.number + " " : ""}${p.firstName} ${p.lastName}`;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <label className="label">Semana</label>
        <input
          type="week"
          className="field"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
        />
        <div className="mt-3 flex items-center justify-between rounded-xl bg-beige px-3 py-2.5">
          <span className="text-sm font-medium">
            Publicar (visible para los jugadores)
          </span>
          <Switch checked={published} onChange={setPublished} label="Publicar" />
        </div>
      </div>

      {drafts.map((d) => (
        <div key={d.key} className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " +
                (d.type === "MATCH"
                  ? "bg-dorado/25 text-negro"
                  : d.type === "DINNER"
                    ? "bg-[#6D28D9]/15 text-[#5B21B6]"
                    : "bg-gris/15 text-gris")
              }
            >
              {d.type === "MATCH" ? (
                <Trophy size={13} />
              ) : d.type === "DINNER" ? (
                <span aria-hidden>🎉</span>
              ) : (
                <Dumbbell size={13} />
              )}
              {d.type === "MATCH"
                ? "Partido"
                : d.type === "DINNER"
                  ? "Cena de equipo"
                  : "Entrenamiento"}
            </span>
            <button
              onClick={() => remove(d.key)}
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
              aria-label="Eliminar actividad"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Fecha</label>
              <input
                type="date"
                className="field"
                value={d.date}
                onChange={(e) => patch(d.key, { date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                {d.type === "MATCH"
                  ? "Hora del partido"
                  : d.type === "DINNER"
                    ? "Hora de convocatoria"
                    : "Hora inicio"}
              </label>
              <input
                type="time"
                className="field"
                value={d.startTime}
                onChange={(e) => patch(d.key, { startTime: e.target.value })}
              />
            </div>
            {d.type === "TRAINING" ? (
              <div>
                <label className="label">Hora fin (opcional)</label>
                <input
                  type="time"
                  className="field"
                  value={d.endTime}
                  onChange={(e) => patch(d.key, { endTime: e.target.value })}
                />
              </div>
            ) : (
              <div>
                <label className="label">Hora convocatoria</label>
                <input
                  type="time"
                  className="field"
                  value={d.callTime}
                  onChange={(e) => patch(d.key, { callTime: e.target.value })}
                />
              </div>
            )}
            {d.type === "DINNER" ? (
              <>
                <div className="col-span-2">
                  <p className="chip bg-[#6D28D9]/15 text-[11px] font-bold text-[#5B21B6]">
                    <span aria-hidden>🎉</span> JORNADA NOCTURNA
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="label">Lugar de la cena *</label>
                  <input
                    className="field"
                    placeholder="Restaurante, sidrería…"
                    value={d.dinnerPlace}
                    onChange={(e) =>
                      patch(d.key, { dinnerPlace: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">
                    Después de la cena (opcional)
                  </label>
                  <input
                    className="field"
                    placeholder="Local, discoteca, zona…"
                    value={d.afterPlace}
                    onChange={(e) =>
                      patch(d.key, { afterPlace: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Observaciones (opcional)</label>
                  <textarea
                    className="field"
                    rows={2}
                    value={d.notes}
                    onChange={(e) => patch(d.key, { notes: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-xl bg-beige px-3 py-2.5">
                  <span className="pr-2 text-sm font-medium text-negro">
                    Permitir votación para Jugador del Mes
                  </span>
                  <Switch
                    checked={d.pollEnabled}
                    onChange={(v) => patch(d.key, { pollEnabled: v })}
                    label="Permitir votación"
                  />
                </div>
                <p className="col-span-2 text-xs text-gris">
                  Activarlo no abre ninguna votación: después habrá que crearla
                  y programarla desde Jugador del Mes.
                </p>
              </>
            ) : (
            <div className="col-span-2">
              <label className="label">
                {d.type === "MATCH" ? "Campo / instalación" : "Campo / lugar"}
              </label>
              <input
                className="field"
                value={d.place}
                onChange={(e) => patch(d.key, { place: e.target.value })}
              />
            </div>
            )}

            {d.type === "MATCH" && (
              <>
                <div>
                  <label className="label">Rival</label>
                  <input
                    className="field"
                    value={d.opponent}
                    onChange={(e) => patch(d.key, { opponent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Jornada</label>
                  <input
                    className="field"
                    inputMode="numeric"
                    value={d.matchday}
                    onChange={(e) => patch(d.key, { matchday: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-xl bg-beige px-3 py-2.5">
                  <span className="text-sm font-medium">
                    Equipación: {d.kitLocal ? "Local" : "Visitante"}
                  </span>
                  <Switch
                    checked={d.kitLocal}
                    onChange={(v) => patch(d.key, { kitLocal: v })}
                    label="Equipación"
                  />
                </div>

                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenConv(openConv === d.key ? null : d.key)
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-gris/30 px-3 py-2.5 text-sm font-medium"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Users size={16} className="text-marino" />
                      Convocatoria
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-bold " +
                          (d.calledPlayerIds.length >= 18
                            ? "bg-amarillo/40 text-negro"
                            : "bg-marino/10 text-marino")
                        }
                      >
                        {d.calledPlayerIds.length}/18
                      </span>
                    </span>
                    {openConv === d.key ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {openConv === d.key && (
                    <div className="mt-2 flex flex-wrap gap-2 rounded-xl bg-beige/60 p-3">
                      {players.length === 0 && (
                        <p className="text-xs text-gris">Sin jugadores.</p>
                      )}
                      {players.map((p) => {
                        const on = d.calledPlayerIds.includes(p.id);
                        const full = d.calledPlayerIds.length >= 18;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={!on && full}
                            onClick={() => toggleCalled(d.key, p.id)}
                            className={
                              "chip border transition " +
                              (on
                                ? "border-marino bg-marino text-blanco"
                                : full
                                  ? "cursor-not-allowed border-gris/20 bg-blanco text-gris/50"
                                  : "border-gris/30 bg-blanco text-negro")
                            }
                          >
                            {label(p)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={() => add("TRAINING")}>
          <Plus size={16} /> Entrenamiento
        </button>
        <button className="btn-ghost" onClick={() => add("DINNER")}>
          <span aria-hidden>🎉</span> Cena de equipo
        </button>
        <button className="btn-ghost" onClick={() => add("MATCH")}>
          <Plus size={16} /> Partido
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}
      {msg && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
          {msg}
        </p>
      )}

      <div className="sticky bottom-2 flex gap-2">
        <button className="btn-primary flex-1" onClick={save} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving
            ? "Guardando cambios…"
            : published
              ? "GUARDAR Y PUBLICAR"
              : "Guardar"}
        </button>
        <button
          className="btn-ghost"
          onClick={() => router.push("/planificacion")}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
