"use client";

import * as React from "react";
import Link from "next/link";
import { Search, UserPlus, Star, ChevronRight } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type P = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  number: number | null;
  positions: string[];
  photo: string | null;
  isCaptain: boolean;
};

type Sort = "name" | "number" | "position";

export function RosterView({
  isCoach,
  players,
}: {
  isCoach: boolean;
  players: P[];
}) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<Sort>("name");

  const nameOf = (p: P) => `${p.firstName} ${p.lastName}`;

  const filtered = players.filter((p) => {
    const hay = `${p.firstName} ${p.lastName} ${p.nickname ?? ""} ${
      p.number ?? ""
    } ${p.positions.join(" ")}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "number")
      return (
        (a.number ?? 9999) - (b.number ?? 9999) ||
        nameOf(a).localeCompare(nameOf(b), "es")
      );
    if (sort === "position")
      return (
        (a.positions[0] ?? "zzz").localeCompare(b.positions[0] ?? "zzz", "es") ||
        nameOf(a).localeCompare(nameOf(b), "es")
      );
    return nameOf(a).localeCompare(nameOf(b), "es");
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-negro">
            Mi Equipo
          </h1>
          <p className="text-sm text-gris">{players.length} jugadores</p>
        </div>
        {isCoach && (
          <Link href="/equipo/nueva" className="btn-gold">
            <UserPlus size={16} /> Crear ficha
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gris"
          />
          <input
            className="field pl-9"
            placeholder="Buscar por nombre, dorsal o posición"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="field w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Ordenar"
        >
          <option value="name">Nombre</option>
          <option value="number">Dorsal</option>
          <option value="position">Posición</option>
        </select>
      </div>

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="card p-6 text-center text-sm text-gris">
            No hay jugadores que coincidan.
          </div>
        )}
        {sorted.map((p) => (
          <Link
            key={p.id}
            href={`/equipo/${p.id}`}
            className="card flex items-center gap-3 p-3 transition hover:bg-beige/60"
          >
            <div className="relative">
              <PlayerAvatar
                photo={p.photo}
                firstName={p.firstName}
                lastName={p.lastName}
                size={44}
              />
              {p.number != null && (
                <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-marino px-1 text-[11px] font-bold text-beige">
                  {p.number}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-medium text-negro">
                {p.firstName} {p.lastName}
                {p.isCaptain && <Star size={13} className="text-dorado" />}
              </p>
              <p className="truncate text-xs text-gris">
                {p.nickname ? `“${p.nickname}” · ` : ""}
                {p.positions.length ? p.positions.join(", ") : "Sin posición"}
              </p>
            </div>
            <ChevronRight size={18} className="text-gris" />
          </Link>
        ))}
      </div>
    </div>
  );
}
