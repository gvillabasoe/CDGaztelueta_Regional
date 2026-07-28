import { redirect } from "next/navigation";
import { FileText, Dumbbell } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  getPlayerByUserId,
  getLastPlannedTraining,
  getPlayerRatings,
  getPlanFiles,
} from "@/lib/planning";
import { RateExercises } from "./RateExercises";

export const dynamic = "force-dynamic";

export default async function PlayerPerfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const player = await getPlayerByUserId(session.userId);
  const [last, files] = await Promise.all([
    getLastPlannedTraining(),
    getPlanFiles(),
  ]);
  const ratings =
    player && last
      ? await getPlayerRatings(
          player.id,
          last.exercises.map((e) => e.id),
        )
      : {};

  return (
    <div className="space-y-6">
      <p className="eyebrow">Mi Perfil</p>

      {/* ── Último entrenamiento ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-marino" />
          <h2 className="font-display text-base font-semibold text-marino">
            Último entrenamiento
          </h2>
        </div>

        {!last ? (
          <p className="card p-4 text-center text-sm text-gris">
            Todavía no hay entrenamientos planificados.
          </p>
        ) : (
          <>
            <div className="rounded-xl bg-marino px-4 py-3 text-beige">
              <p className="text-sm font-semibold">
                {last.dayLabel} · {last.dateLabel}
              </p>
              <p className="text-xs text-beige/70">{last.weekLabel}</p>
            </div>

            {last.exercises.length === 0 ? (
              <p className="card p-4 text-center text-sm text-gris">
                Este entrenamiento no tiene ejercicios.
              </p>
            ) : !player ? (
              <p className="card p-4 text-center text-sm text-gris">
                Tu usuario no está asociado a una ficha de jugador.
              </p>
            ) : (
              <RateExercises
                exercises={last.exercises}
                initialRatings={ratings}
              />
            )}
          </>
        )}
      </section>

      {/* ── Archivos de planificación ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-marino" />
          <h2 className="font-display text-base font-semibold text-marino">
            Archivos de planificación
          </h2>
        </div>

        {files.length === 0 ? (
          <p className="card p-4 text-center text-sm text-gris">
            No hay archivos disponibles.
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="card flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-marino">
                    {f.fileName}
                  </p>
                  <p className="text-xs text-gris">{f.weekLabel}</p>
                </div>
                <a
                  href={`/api/plan-file/${f.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost shrink-0"
                >
                  <FileText size={16} /> Ver
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
