"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function MonthSelect({ year, month0 }: { year: number; month0: number }) {
  const router = useRouter();
  const goto = (y: number, m0: number) =>
    router.push(`/equipo/jugador-del-mes?y=${y}&m=${m0 + 1}`);
  return (
    <div className="card flex items-center justify-between p-2">
      <button
        onClick={() => (month0 - 1 < 0 ? goto(year - 1, 11) : goto(year, month0 - 1))}
        className="rounded-lg p-2 text-marino hover:bg-marino/10"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <select
        className="field w-auto border-0 text-center font-semibold"
        value={month0}
        onChange={(e) => goto(year, parseInt(e.target.value, 10))}
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i}>
            {m} {year}
          </option>
        ))}
      </select>
      <button
        onClick={() => (month0 + 1 > 11 ? goto(year + 1, 0) : goto(year, month0 + 1))}
        className="rounded-lg p-2 text-marino hover:bg-marino/10"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
