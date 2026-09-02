"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Trophy,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Users,
} from "lucide-react";
import { setPublished, deletePlan } from "@/actions/plan";

export type ActivityLite = {
  id: string;
  type: "TRAINING" | "MATCH";
  dayName: string;
  dateShort: string;
  startTime: string;
  endTime: string | null;
  place: string | null;
  opponent: string | null;
  matchday: number | null;
  callTime: string | null;
  kitLocal: boolean | null;
  exerciseCount: number;
  calledCount: number;
  goingCount: number;
  notGoingCount: number;
  hasRecord: boolean;
  pdfPending?: boolean; // PDF nuevo sin consultar por ESTE usuario
};

export type PlanLite = {
  id: string;
  weekLabel: string;
  published: boolean;
  activities: ActivityLite[];
};

export function PlanList({
  isCoach,
  plans,
}: {
  isCoach: boolean;
  plans: PlanLite[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function togglePublish(p: PlanLite) {
    setBusy(p.id);
    await setPublished(p.id, !p.published);
    setBusy(null);
    router.refresh();
  }
  async function remove(p: PlanLite) {
    if (!confirm(`¿Eliminar la planificación "${p.weekLabel}" y sus actividades?`))
      return;
    setBusy(p.id);
    await deletePlan(p.id);
    setBusy(null);
    router.refresh();
  }

  if (plans.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-gris">
        {isCoach
          ? "Todavía no has creado ninguna planificación."
          : "Todavía no hay planificaciones publicadas."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((p) => (
        <div key={p.id} className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-gris/10 bg-beige/50 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-negro">{p.weekLabel}</p>
              <span
                className={
                  "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (p.published
                    ? "bg-green-100 text-green-700"
                    : "bg-gris/20 text-gris")
                }
              >
                {p.published ? "Publicada" : "Borrador"}
              </span>
            </div>
            {isCoach && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => togglePublish(p)}
                  disabled={busy === p.id}
                  className="rounded-lg p-1.5 text-marino hover:bg-marino/10"
                  aria-label={p.published ? "Ocultar" : "Publicar"}
                  title={p.published ? "Ocultar" : "Publicar"}
                >
                  {p.published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <Link
                  href={`/planificacion/${p.id}`}
                  className="rounded-lg p-1.5 text-marino hover:bg-marino/10"
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </Link>
                <button
                  onClick={() => remove(p)}
                  disabled={busy === p.id}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                  aria-label="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <ul className="divide-y divide-gris/10">
            {p.activities.length === 0 && (
              <li className="px-4 py-4 text-sm text-gris">Sin actividades.</li>
            )}
            {p.activities.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/planificacion/actividad/${a.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-beige/40"
                >
                  <span
                    className={
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                      (a.type === "MATCH"
                        ? "bg-dorado/20 text-dorado"
                        : "bg-marino/10 text-marino")
                    }
                  >
                    {a.pdfPending && (
                      <span
                        role="status"
                        aria-label="Documento nuevo sin consultar"
                        title="Documento nuevo sin consultar"
                        className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-blanco"
                      />
                    )}
                    {a.type === "MATCH" ? (
                      <Trophy size={17} />
                    ) : (
                      <Dumbbell size={17} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium capitalize text-negro">
                      {a.dayName} {a.dateShort}
                      <span
                        className={
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                          (a.type === "MATCH"
                            ? "bg-dorado/20 text-marino"
                            : "bg-marino/10 text-marino")
                        }
                      >
                        {a.type === "MATCH" ? "Partido" : "Entreno"}
                      </span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gris">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {a.startTime}
                        {a.endTime ? `–${a.endTime}` : ""}
                      </span>
                      {a.type === "MATCH" && a.opponent && (
                        <span>vs {a.opponent}</span>
                      )}
                      {a.place && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {a.place}
                        </span>
                      )}
                    </p>
                    {p.published && (
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px]">
                        <span className="text-green-700">
                          {a.goingCount} asistirán
                        </span>
                        <span className="text-red-600">
                          {a.notGoingCount} no
                        </span>
                        {a.type === "MATCH" && (
                          <span className="inline-flex items-center gap-1 text-gris">
                            <Users size={11} />
                            {a.calledCount}/18 convocados
                          </span>
                        )}
                        {a.hasRecord && (
                          <span className="rounded bg-marino/10 px-1.5 text-marino">
                            Registrado
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-gris" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
