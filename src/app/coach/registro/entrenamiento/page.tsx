import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, ChevronRight } from "lucide-react";
import { getSelectableTrainings } from "@/lib/planning";

export const dynamic = "force-dynamic";

export default async function SeleccionarEntrenamientoPage() {
  const trainings = await getSelectableTrainings();
  if (trainings.length === 0) redirect("/coach/registro");

  return (
    <div className="space-y-4">
      <p className="eyebrow">Registrar entrenamiento</p>
      <p className="text-sm text-gris">
        Selecciona a qué entrenamiento de la planificación corresponde este
        registro.
      </p>
      <ul className="space-y-2">
        {trainings.map((t) => (
          <li key={t.id}>
            <Link
              href={`/coach/registro/entrenamiento/nuevo/${t.id}`}
              className="card flex items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-2">
                <Dumbbell size={16} className="text-marino" />
                <div>
                  <p className="text-sm font-semibold text-marino">
                    {t.dayLabel} · {t.dateLabel}
                  </p>
                  <p className="text-xs text-gris">{t.weekLabel}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gris" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
