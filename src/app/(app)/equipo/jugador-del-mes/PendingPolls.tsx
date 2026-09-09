import Link from "next/link";
import { Check } from "lucide-react";

export type PollItem = {
  pollId: string;
  state: "PENDING" | "OPEN" | "CLOSED" | "CANCELLED";
  label: string; // p. ej. "Jornada 4 – CD Gaztelueta vs Rival"
  dateLabel: string;
  opensAtLabel: string | null;
  voted: boolean;
  pending: boolean;
};

// Estado personal de cada votación. Las que todavía no están abiertas NO
// aparecen como pendientes de completar (§19).
export function PendingPolls({
  items,
  canVote,
}: {
  items: PollItem[];
  canVote: boolean;
}) {
  const pending = items.filter((i) => i.pending);
  const openVoted = items.filter((i) => i.state === "OPEN" && i.voted);
  const closedNotVoted = items.filter(
    (i) => i.state === "CLOSED" && !i.voted,
  );
  const scheduled = items.filter((i) => i.state === "PENDING");

  if (
    pending.length === 0 &&
    openVoted.length === 0 &&
    closedNotVoted.length === 0 &&
    scheduled.length === 0
  )
    return null;

  return (
    <div>
      <h2 className="eyebrow mb-2 px-1">Votaciones pendientes</h2>
      <div className="space-y-2">
        {pending.map((i) => (
          <div
            key={i.pollId}
            className="card border border-red-200 bg-red-50 p-3"
          >
            <p className="flex items-start gap-1.5 text-sm font-semibold text-negro">
              <span
                aria-hidden
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600"
              />
              <span className="min-w-0">{i.label}</span>
            </p>
            <p className="mt-1 text-xs text-negro">
              Te queda pendiente realizar tu reparto de 3, 2 y 1 punto.
            </p>
            <Link
              href={`/equipo/jugador-del-mes/votar/${i.pollId}`}
              className="btn-gold mt-2 w-full"
            >
              VOTAR AHORA
            </Link>
          </div>
        ))}

        {openVoted.map((i) => (
          <div key={i.pollId} className="card p-3">
            <p className="truncate text-sm font-medium text-negro">{i.label}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              <Check size={13} /> YA HE VOTADO
            </p>
          </div>
        ))}

        {scheduled.map((i) => (
          <div key={i.pollId} className="card p-3">
            <p className="truncate text-sm font-medium text-negro">{i.label}</p>
            <p className="mt-1 text-xs font-semibold text-gris">
              PENDIENTE DE APERTURA
            </p>
            <p className="text-xs text-gris">
              La votación todavía no está abierta.
              {i.opensAtLabel ? ` Se abrirá el ${i.opensAtLabel}.` : ""}
            </p>
          </div>
        ))}

        {closedNotVoted.map((i) => (
          <div key={i.pollId} className="card p-3">
            <p className="truncate text-sm font-medium text-negro">{i.label}</p>
            <p className="mt-1 text-xs text-gris">
              Votación cerrada — No participaste.
            </p>
          </div>
        ))}

        {!canVote && (
          <p className="px-1 text-xs text-gris">
            No tienes permiso para votar en Jugador del Mes.
          </p>
        )}
      </div>
    </div>
  );
}
