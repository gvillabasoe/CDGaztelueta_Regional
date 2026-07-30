import Link from "next/link";
import {
  Star,
  CalendarDays,
  ClipboardList,
  Wallet,
  User as UserIcon,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { currentPlayer, lastTraining, playerRatings } from "@/lib/queries";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { formatDateLong } from "@/lib/format";
import { RateExercises } from "./RateExercises";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await getSession();

  if (session?.role === "COACH") {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-negro">
          Perfil personal
        </h1>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marino text-beige">
              <UserIcon size={22} />
            </span>
            <div>
              <p className="font-semibold text-negro">@{session.username}</p>
              <p className="text-sm text-gris">Entrenador</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gris">
            Puedes gestionar los datos del equipo en Configuración.
          </p>
        </div>
      </div>
    );
  }

  const player = await currentPlayer();
  if (!player) {
    return (
      <div className="card p-6 text-center text-sm text-gris">
        No se ha encontrado tu ficha de jugador.
      </div>
    );
  }

  const training = await lastTraining();
  const exerciseIds = training?.exercises.map((e) => e.id) ?? [];
  const ratings = await playerRatings(player.id, exerciseIds);

  const stats: [string, number][] = [
    ["Convocatorias", player.callups],
    ["Minutos", player.minutes],
    ["Titularidades", player.starts],
    ["Suplencias", player.benchCount],
    ["Goles", player.goalsCount],
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-negro">
        Perfil personal
      </h1>

      <div className="card p-5">
        <div className="flex items-center gap-4">
          <PlayerAvatar
            photo={player.photo}
            firstName={player.firstName}
            lastName={player.lastName}
            size={64}
          />
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-semibold text-negro">
              {player.firstName} {player.lastName}
              {player.isCaptain && <Star size={16} className="text-dorado" />}
            </p>
            {player.nickname && (
              <p className="text-sm text-gris">“{player.nickname}”</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {player.number != null && (
                <span className="chip bg-marino text-beige">
                  #{player.number}
                </span>
              )}
              {player.positions.map((p) => (
                <span key={p} className="chip bg-dorado/20 text-marino">
                  {p}
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

      <div className="card p-5">
        <p className="eyebrow mb-1">Último entrenamiento</p>
        {!training ? (
          <p className="text-sm text-gris">
            Todavía no hay entrenamientos publicados.
          </p>
        ) : (
          <>
            <p className="mb-3 flex items-center gap-2 text-sm capitalize text-negro">
              <CalendarDays size={15} className="text-gris" />
              {formatDateLong(training.date)}
            </p>
            {training.exercises.length === 0 ? (
              <p className="text-sm text-gris">
                Este entrenamiento no tiene ejercicios para valorar.
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs text-gris">
                  Valora del 1 al 10 cada ejercicio (solo tú ves tu valoración).
                </p>
                <RateExercises
                  exercises={training.exercises.map((e) => ({
                    id: e.id,
                    task: e.task,
                  }))}
                  initialRatings={ratings}
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link href={`/equipo/${player.id}`} className="btn-ghost">
          <UserIcon size={16} /> Mi ficha
        </Link>
        <Link href="/planificacion" className="btn-ghost">
          <ClipboardList size={16} /> Planificación
        </Link>
        <Link href="/multas" className="btn-ghost">
          <Wallet size={16} /> Mis multas
        </Link>
      </div>
    </div>
  );
}
