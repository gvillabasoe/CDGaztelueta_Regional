"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, Pencil, Loader2 } from "lucide-react";
import { Switch } from "@/components/Switch";
import { updateNextMatch } from "@/actions/nextmatch";

type Data = {
  matchday: number | null;
  date: string | null; // yyyy-mm-dd
  time: string | null;
  opponent: string | null;
  place: string | null;
  isHome: boolean;
};

export function NextMatchCard({
  isCoach,
  data,
  dateLong,
}: {
  isCoach: boolean;
  data: Data;
  dateLong: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [matchday, setMatchday] = React.useState(
    data.matchday != null ? String(data.matchday) : "",
  );
  const [date, setDate] = React.useState(data.date ?? "");
  const [time, setTime] = React.useState(data.time ?? "");
  const [opponent, setOpponent] = React.useState(data.opponent ?? "");
  const [place, setPlace] = React.useState(data.place ?? "");
  const [isHome, setIsHome] = React.useState(data.isHome);

  const hasData = data.date || data.opponent || data.matchday != null;

  async function save() {
    setSaving(true);
    setError(null);
    const res = await updateNextMatch({
      matchday: matchday.trim() ? parseInt(matchday, 10) : null,
      date: date || null,
      time: time || null,
      opponent: opponent.trim() || null,
      place: place.trim() || null,
      isHome,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (isCoach && editing) {
    return (
      <div className="card p-4">
        <p className="eyebrow mb-3">Próximo partido</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Jornada</label>
            <input
              className="field"
              inputMode="numeric"
              value={matchday}
              onChange={(e) => setMatchday(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Hora</label>
            <input
              type="time"
              className="field"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Fecha</label>
            <input
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Rival</label>
            <input
              className="field"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Campo / instalación</label>
            <input
              className="field"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-xl bg-beige px-3 py-2">
            <span className="text-sm font-medium">
              {isHome ? "Local" : "Visitante"}
            </span>
            <Switch checked={isHome} onChange={setIsHome} label="Local o visitante" />
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
        )}
        <div className="mt-4 flex gap-2">
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />} Guardar
          </button>
          <button
            className="btn-ghost"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-marino px-4 py-2.5 text-beige">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-dorado">
          Próximo partido
        </p>
        {isCoach && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-beige/90 hover:bg-blanco/10"
          >
            <Pencil size={13} /> Editar
          </button>
        )}
      </div>
      <div className="p-4">
        {!hasData ? (
          <p className="text-sm text-gris">
            Todavía no se ha configurado el próximo partido.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {data.matchday != null && (
                <span className="chip bg-dorado/20 text-marino">
                  Jornada {data.matchday}
                </span>
              )}
              <span
                className={
                  "chip " +
                  (data.isHome
                    ? "bg-marino/10 text-marino"
                    : "bg-gris/15 text-negro")
                }
              >
                {data.isHome ? "Local" : "Visitante"}
              </span>
            </div>
            <p className="mt-2 font-display text-xl font-semibold text-negro">
              CD Gaztelueta {data.isHome ? "vs" : "@"} {data.opponent || "—"}
            </p>
            <div className="mt-3 space-y-1.5 text-sm text-negro">
              {dateLong && (
                <p className="flex items-center gap-2 capitalize">
                  <CalendarDays size={15} className="text-gris" /> {dateLong}
                </p>
              )}
              {data.time && (
                <p className="flex items-center gap-2">
                  <Clock size={15} className="text-gris" /> {data.time}
                </p>
              )}
              {data.place && (
                <p className="flex items-center gap-2">
                  <MapPin size={15} className="text-gris" /> {data.place}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
