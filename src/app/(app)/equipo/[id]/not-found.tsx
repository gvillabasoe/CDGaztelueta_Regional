import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Estado controlado cuando la ficha solicitada no existe.
export default function FichaNotFound() {
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
          Ficha no encontrada
        </h1>
        <p className="mt-2 text-sm text-gris">
          Este jugador no existe o su ficha se ha eliminado.
        </p>
        <Link href="/equipo" className="btn-primary mt-4 w-full">
          Volver a Mi Equipo
        </Link>
      </div>
    </div>
  );
}
