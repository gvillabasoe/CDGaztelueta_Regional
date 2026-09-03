import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  playerLeagueHistory,
  currentPlayer,
  findPlayerByAnyId,
} from "@/lib/queries";
import { formatDateShort } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { publicName } from "@/lib/profile";
import { FichaForm, type FichaData } from "../FichaForm";
import { LeagueHistory } from "../LeagueHistory";

export const dynamic = "force-dynamic";

export default async function FichaPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  // Admite id de ficha o id de cuenta; si no existe, estado controlado (not-found).
  const p = await findPlayerByAnyId(params.id);
  if (!p) notFound();
  const isCoach = session?.role === "COACH";

  const hist = await playerLeagueHistory(p.id);
  const histEntries = hist.entries.map((e) => ({
    id: e.id,
    dateLabel: formatDateShort(e.date),
    exerciseName: e.exerciseName,
    points: e.points,
    note: e.note,
  }));

  const back = (
    <Link
      href="/equipo"
      className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
    >
      <ChevronLeft size={16} /> Mi Equipo
    </Link>
  );

  if (isCoach) {
    const initial: FichaData = {
      firstName: p.firstName,
      lastName: p.lastName,
      nickname: p.nickname,
      number: p.number,
      age: p.age,
      isCaptain: p.isCaptain,
      positions: p.positions,
      photo: p.photo,
      email: p.email,
      phone: p.phone,
      status: (p.status ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "PENDING",
      callups: p.callups ?? 0,
      minutes: p.minutes ?? 0,
      starts: p.starts ?? 0,
      benchCount: p.benchCount ?? 0,
      goalsCount: p.goalsCount ?? 0,
    };
    return (
      <div className="space-y-4">
        {back}
        <h1 className="font-display text-2xl font-semibold text-negro">
          Editar ficha
        </h1>
        <FichaForm mode="edit" playerId={p.id} initial={initial} />
        <LeagueHistory
          total={hist.total}
          priorBalance={hist.priorBalance}
          entries={histEntries}
          editable
        />
      </div>
    );
  }

  // Solo el propio jugador ve el detalle de su historial (35).
  const me = await currentPlayer();
  const isOwn = me?.id === p.id;

  // Vista de solo lectura (jugador)
  // Un valor ausente o no numérico se muestra siempre como 0 (nunca undefined/null/NaN).
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const stats: [string, number][] = [
    ["Convocatorias", num(p.callups)],
    ["Minutos", num(p.minutes)],
    ["Titularidades", num(p.starts)],
    ["Suplencias", num(p.benchCount)],
    ["Goles", num(p.goalsCount)],
  ];

  return (
    <div className="space-y-4">
      {back}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar
            photo={p.photo ?? null}
            name={publicName(p.nickname, p.firstName, p.lastName)}
            size={72}
          />
          <div>
            <h1 className="flex items-center gap-2 font-display text-xl font-semibold text-negro">
              {`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Jugador"}
              {p.isCaptain && <Star size={16} className="text-dorado" />}
            </h1>
            {p.nickname && <p className="text-sm text-gris">“{p.nickname}”</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.number != null && (
                <span className="chip bg-marino text-beige">#{p.number}</span>
              )}
              {p.age != null && (
                <span className="chip bg-beige text-negro">{p.age} años</span>
              )}
              {(p.positions ?? []).map((pos) => (
                <span key={pos} className="chip bg-dorado/20 text-marino">
                  {pos}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <p className="eyebrow mb-3">Estadísticas</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {stats.map(([lbl, val]) => (
            <div key={lbl} className="rounded-xl bg-beige p-3 text-center">
              <p className="font-display text-2xl font-bold text-marino">
                {val}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-gris">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {isOwn && (
        <LeagueHistory
          total={hist.total}
          priorBalance={hist.priorBalance}
          entries={histEntries}
          editable={false}
        />
      )}
    </div>
  );
}
