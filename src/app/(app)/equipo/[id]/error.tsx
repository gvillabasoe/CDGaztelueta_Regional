"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCw } from "lucide-react";

// Barrera de error específica de la ficha del jugador.
export default function FichaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Error al abrir la ficha:", error);
  }, [error]);

  return (
    <div className="space-y-4">
      <Link
        href="/equipo"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Mi Equipo
      </Link>
      <div className="card p-6 text-center">
        <h1 className="font-display text-xl font-semibold text-negro">
          No se ha podido abrir la ficha
        </h1>
        <p className="mt-2 text-sm text-gris">
          Inténtalo de nuevo. Si el problema continúa, avisa al entrenador.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button onClick={reset} className="btn-primary w-full">
            <RefreshCw size={16} /> Volver a intentarlo
          </button>
          <Link href="/equipo" className="btn-ghost w-full">
            Volver a Mi Equipo
          </Link>
        </div>
      </div>
    </div>
  );
}
