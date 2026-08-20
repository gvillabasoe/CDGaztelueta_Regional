"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

// Barrera de error del área privada: evita la pantalla general de
// "Application Error" y ofrece una salida controlada.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Información técnica para diagnóstico (no se muestra al usuario).
    console.error("Error en la aplicación:", error);
  }, [error]);

  return (
    <div className="card p-6 text-center">
      <h1 className="font-display text-xl font-semibold text-negro">
        No se ha podido cargar esta pantalla
      </h1>
      <p className="mt-2 text-sm text-gris">
        Ha ocurrido un problema al obtener los datos. Puedes volver a intentarlo
        o regresar al inicio.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button onClick={reset} className="btn-primary w-full">
          <RefreshCw size={16} /> Volver a intentarlo
        </button>
        <Link href="/equipo" className="btn-ghost w-full">
          Ir a Mi Equipo
        </Link>
        <Link href="/home" className="btn-ghost w-full">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
