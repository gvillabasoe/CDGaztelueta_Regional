import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CrearFicha } from "./CrearFicha";

export const dynamic = "force-dynamic";

function initials(first: string, last: string) {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

export default async function EquipoPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      number: true,
      positions: true,
      isCaptain: true,
      photo: true,
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Mi Equipo</p>
        <span className="text-xs text-gris">
          {players.length} {players.length === 1 ? "jugador" : "jugadores"}
        </span>
      </div>

      <CrearFicha />

      {players.length === 0 ? (
        <p className="card p-6 text-center text-sm text-gris">
          Todavía no hay jugadores. Pulsa “Crear ficha” para añadir el primero.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {players.map((p) => (
            <li key={p.id} className="card overflow-hidden p-4 text-center">
              <div className="relative mx-auto mb-2 h-20 w-20">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo}
                    alt={`${p.firstName} ${p.lastName}`}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-beige"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-marino font-display text-2xl font-semibold text-beige">
                    {initials(p.firstName, p.lastName)}
                  </span>
                )}
                {p.number !== null && (
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-dorado font-display text-sm font-bold text-marino ring-2 ring-blanco">
                    {p.number}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-1">
                <p className="truncate text-sm font-semibold text-marino">
                  {p.nickname?.trim() || p.firstName}
                </p>
                {p.isCaptain && (
                  <Star size={14} className="shrink-0 fill-dorado text-dorado" />
                )}
              </div>
              <p className="truncate text-xs text-gris">
                {p.firstName} {p.lastName}
              </p>
              {p.positions.length > 0 && (
                <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-marino/70">
                  {p.positions.join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
