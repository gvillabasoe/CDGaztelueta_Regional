import Link from "next/link";
import {
  Plus,
  Dumbbell,
  Goal,
  CalendarDays,
  Pencil,
  FileText,
  ClipboardList,
} from "lucide-react";
import {
  getPlansSummary,
  getSelectableTrainings,
  getSavedTrainingRecords,
  getSavedMatchRecords,
} from "@/lib/planning";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const [plans, selectable, savedTrainings, savedMatches] = await Promise.all([
    getPlansSummary(),
    getSelectableTrainings(),
    getSavedTrainingRecords(),
    getSavedMatchRecords(),
  ]);

  const hasPlan = plans.length > 0;
  const canTraining = selectable.length > 0;

  return (
    <div className="space-y-6">
      <p className="eyebrow">Registro</p>

      {/* ── Planificación semanal ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-marino" />
          <h2 className="font-display text-base font-semibold text-marino">
            Planificación semanal
          </h2>
        </div>

        <Link href="/coach/registro/planificacion/nueva" className="btn-gold w-full">
          <Plus size={18} /> Crear Planificación Semanal
        </Link>

        {plans.length === 0 ? (
          <p className="card p-4 text-center text-sm text-gris">
            Todavía no hay planificaciones semanales.
          </p>
        ) : (
          <ul className="space-y-2">
            {plans.map((p) => (
              <li
                key={p.id}
                className="card flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-marino">
                    {p.weekLabel}
                  </p>
                  <p className="text-xs text-gris">
                    {p.trainingsCount}{" "}
                    {p.trainingsCount === 1 ? "entrenamiento" : "entrenamientos"}
                    {p.hasMatch ? " · partido" : ""}
                  </p>
                  {p.fileName && (
                    <a
                      href={`/api/plan-file/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-marino underline"
                    >
                      <FileText size={12} /> Ver archivo
                    </a>
                  )}
                </div>
                <Link
                  href={`/coach/registro/planificacion/${p.id}`}
                  className="btn-ghost shrink-0"
                >
                  <Pencil size={16} /> Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Nuevo registro ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-marino" />
          <h2 className="font-display text-base font-semibold text-marino">
            Nuevo registro
          </h2>
        </div>

        {!hasPlan && (
          <p className="card p-4 text-center text-sm text-gris">
            Crea primero una planificación semanal para poder registrar
            entrenamientos y partidos.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {canTraining ? (
            <Link
              href="/coach/registro/entrenamiento"
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-blanco px-4 py-5 font-semibold text-marino shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-beige text-marino">
                <Dumbbell size={22} />
              </span>
              Registrar entrenamiento
            </Link>
          ) : (
            <span className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-blanco/60 px-4 py-5 font-semibold text-gris/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-beige/60">
                <Dumbbell size={22} />
              </span>
              Registrar entrenamiento
            </span>
          )}

          {hasPlan ? (
            <Link
              href="/coach/registro/partido/nuevo"
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-blanco px-4 py-5 font-semibold text-marino shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-beige text-marino">
                <Goal size={22} />
              </span>
              Registrar partido
            </Link>
          ) : (
            <span className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-blanco/60 px-4 py-5 font-semibold text-gris/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-beige/60">
                <Goal size={22} />
              </span>
              Registrar partido
            </span>
          )}
        </div>

        {hasPlan && !canTraining && (
          <p className="text-xs text-gris">
            No hay entrenamientos planificados pendientes de registrar. Añade
            entrenamientos en una planificación.
          </p>
        )}
      </section>

      {/* ── Registros guardados (editables) ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Pencil size={18} className="text-marino" />
          <h2 className="font-display text-base font-semibold text-marino">
            Registros guardados
          </h2>
        </div>

        {savedTrainings.length === 0 && savedMatches.length === 0 ? (
          <p className="card p-4 text-center text-sm text-gris">
            Todavía no hay registros guardados.
          </p>
        ) : (
          <div className="space-y-4">
            {savedTrainings.length > 0 && (
              <div className="space-y-2">
                <p className="label">Entrenamientos</p>
                <ul className="space-y-2">
                  {savedTrainings.map((r) => (
                    <li
                      key={r.id}
                      className="card flex items-center justify-between gap-3 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Dumbbell size={16} className="shrink-0 text-marino" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-marino">
                            {r.dateLabel}
                          </p>
                          <p className="truncate text-xs text-gris">{r.sub}</p>
                        </div>
                      </div>
                      <Link
                        href={`/coach/registro/entrenamiento/editar/${r.id}`}
                        className="btn-ghost shrink-0"
                      >
                        <Pencil size={16} /> Editar
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {savedMatches.length > 0 && (
              <div className="space-y-2">
                <p className="label">Partidos</p>
                <ul className="space-y-2">
                  {savedMatches.map((r) => (
                    <li
                      key={r.id}
                      className="card flex items-center justify-between gap-3 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Goal size={16} className="shrink-0 text-marino" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-marino">
                            {r.dateLabel}
                          </p>
                          <p className="truncate text-xs text-gris">
                            {r.opponent}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/coach/registro/partido/editar/${r.id}`}
                        className="btn-ghost shrink-0"
                      >
                        <Pencil size={16} /> Editar
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
