"use client";

import { Avatar } from "@/components/Avatar";

export type PublicBallot = {
  id: string;
  voterName: string;
  voterPhoto: string | null;
  onBehalf: boolean;
  dateLabel: string;
  first: { name: string; photo: string | null };
  second: { name: string; photo: string | null };
  third: { name: string; photo: string | null };
};

// VOTOS DEL PARTIDO: las papeletas son públicas. Solo se muestran las válidas
// (las anuladas se excluyen en la consulta) y consultarlas no permite editarlas.
export function PublicVotes({ ballots }: { ballots: PublicBallot[] }) {
  if (ballots.length === 0)
    return (
      <p className="text-sm text-gris">
        Todavía no hay votos en este partido.
      </p>
    );

  const line = (
    pts: number,
    who: { name: string; photo: string | null },
  ) => (
    <li className="flex items-center gap-2 text-sm">
      <span className="w-14 shrink-0 font-bold text-marino">{pts} pts</span>
      <Avatar photo={who.photo} name={who.name} size={22} />
      <span className="min-w-0 truncate text-negro">{who.name}</span>
    </li>
  );

  return (
    <div className="space-y-2">
      {ballots.map((b) => (
        <div key={b.id} className="rounded-xl border border-gris/20 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Avatar photo={b.voterPhoto} name={b.voterName} size={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-negro">
                {b.voterName}
                {b.onBehalf && (
                  <span className="ml-1.5 text-[10px] font-semibold uppercase text-gris">
                    (registrado por el entrenador)
                  </span>
                )}
              </p>
              <p className="text-xs text-gris">{b.dateLabel}</p>
            </div>
          </div>
          <ul className="space-y-1">
            {line(3, b.first)}
            {line(2, b.second)}
            {line(1, b.third)}
          </ul>
        </div>
      ))}
    </div>
  );
}
