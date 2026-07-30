import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Star, Settings, Check, Trophy } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  latestPoll,
  monthlyClassification,
  winnersHistory,
  pollAdminData,
} from "@/lib/queries";
import { formatDateLong, formatDateTime } from "@/lib/format";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { MonthSelect } from "./MonthSelect";

export const dynamic = "force-dynamic";

const MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const monthLabel = (mk: string) => {
  const [y, m] = mk.split("-");
  return `${MES[parseInt(m, 10) - 1]} ${y}`;
};

export default async function JugadorDelMesPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const isCoach = session.role === "COACH";
  const now = new Date();

  const year = parseInt(searchParams.y ?? "", 10) || now.getFullYear();
  const mRaw = parseInt(searchParams.m ?? "", 10);
  const month0 =
    (Number.isFinite(mRaw) && mRaw >= 1 && mRaw <= 12 ? mRaw : now.getMonth() + 1) - 1;
  const monthKey = `${year}-${String(month0 + 1).padStart(2, "0")}`;

  const poll = await latestPoll();
  const classification = await monthlyClassification(monthKey);
  const winners = await winnersHistory();

  // Estado de la votación del último partido
  let pollBlock: React.ReactNode = null;
  if (poll) {
    const accepting = poll.status === "OPEN" && now < poll.closesAt;
    const cancelled = poll.status === "CANCELLED";
    const closed = !cancelled && (poll.status === "CLOSED" || now >= poll.closesAt);
    const nameById = new Map(
      poll.candidates.map((c) => [c.id, `${c.firstName} ${c.lastName}`]),
    );

    let voted = false;
    if (!isCoach) {
      const me = await prisma.player.findFirst({
        where: { userId: session.userId },
        select: { id: true },
      });
      const ballot = await prisma.ballot.findUnique({
        where: { pollId_voterId: { pollId: poll.id, voterId: session.userId } },
        select: { id: true },
      });
      voted = !!ballot && !!me;
    }

    // Resultado (solo si cerrada): agregación por candidato
    let result: { name: string; points: number }[] = [];
    if (closed) {
      const ballots = await prisma.ballot.findMany({
        where: { pollId: poll.id, excluded: false },
        select: { firstId: true, secondId: true, thirdId: true },
      });
      const pts = new Map<string, number>();
      const add = (id: string, n: number) => pts.set(id, (pts.get(id) ?? 0) + n);
      for (const b of ballots) {
        add(b.firstId, 3);
        add(b.secondId, 2);
        add(b.thirdId, 1);
      }
      result = [...pts.entries()]
        .map(([id, points]) => ({ name: nameById.get(id) ?? "—", points }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
    }

    let admin: Awaited<ReturnType<typeof pollAdminData>> = null;
    if (isCoach) admin = await pollAdminData(poll.id);

    pollBlock = (
      <div className="card overflow-hidden">
        <div className="bg-marino px-4 py-2.5 text-beige">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-dorado">
            Votación del último partido
          </p>
        </div>
        <div className="space-y-3 p-4 text-sm">
          <p className="font-medium capitalize text-negro">
            {poll.activity.opponent
              ? `CD Gaztelueta vs ${poll.activity.opponent}`
              : "Partido"}{" "}
            · {formatDateLong(poll.activity.date)}
          </p>

          {cancelled && (
            <p className="rounded-lg bg-gris/15 px-3 py-2 text-gris">
              Esta votación fue anulada.
            </p>
          )}

          {!cancelled && accepting && !isCoach && (
            <>
              {voted ? (
                <p className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 font-semibold text-green-700">
                  <Check size={15} /> YA HE VOTADO
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 font-semibold text-red-700">
                    ⚠ NO HE VOTADO
                  </p>
                  <Link
                    href={`/equipo/jugador-del-mes/votar/${poll.id}`}
                    className="btn-gold w-full"
                  >
                    Votar ahora
                  </Link>
                </div>
              )}
              <p className="text-xs text-gris">
                Puedes votar hasta el {formatDateTime(poll.closesAt)}.
              </p>
            </>
          )}

          {!cancelled && accepting && isCoach && admin && (
            <p className="text-xs text-gris">
              Participación: {admin.votedCount}/{admin.eligibleCount} (
              {admin.eligibleCount
                ? Math.round((admin.votedCount / admin.eligibleCount) * 100)
                : 0}
              %). Cierra el {formatDateTime(poll.closesAt)}.
            </p>
          )}

          {closed && (
            <div>
              <p className="mb-1 text-xs font-semibold text-gris">
                La votación de este partido ha finalizado.
              </p>
              {result.length === 0 ? (
                <p className="text-xs text-gris">Sin votos registrados.</p>
              ) : (
                <ol className="space-y-1">
                  {result.map((r, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>
                        {i + 1}. {r.name}
                      </span>
                      <span className="font-semibold text-marino">
                        {r.points} pts
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {isCoach && (
            <Link
              href="/equipo/jugador-del-mes/admin"
              className="btn-ghost w-full"
            >
              <Settings size={15} /> Gestionar votaciones
            </Link>
          )}
        </div>
      </div>
    );
  } else if (isCoach) {
    pollBlock = (
      <div className="card p-4">
        <p className="mb-3 text-sm text-gris">
          Todavía no hay ninguna votación.
        </p>
        <Link href="/equipo/jugador-del-mes/admin" className="btn-gold w-full">
          <Settings size={15} /> Crear votación
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/equipo"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Mi Equipo
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Jugador del Mes
      </h1>

      {pollBlock}

      {/* Clasificación mensual */}
      <div>
        <h2 className="eyebrow mb-2 px-1">Clasificación mensual</h2>
        <MonthSelect year={year} month0={month0} />
        <div className="mt-2 space-y-2">
          {classification.length === 0 ? (
            <div className="card p-5 text-center text-sm text-gris">
              Sin jugadores.
            </div>
          ) : (
            classification.map((r, i) => {
              const first = i === 0 && r.points > 0;
              return (
                <div
                  key={r.id}
                  className={
                    "card flex items-center gap-3 p-3 " +
                    (first ? "bg-amarillo/25 ring-1 ring-dorado" : "")
                  }
                >
                  <div className="flex w-7 justify-center">
                    {first ? (
                      <Star size={18} className="text-dorado" />
                    ) : (
                      <span className="text-sm font-semibold text-gris">
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <PlayerAvatar
                    photo={r.photo}
                    firstName={r.name.split(" ")[0] ?? ""}
                    lastName={r.name.split(" ").slice(1).join(" ")}
                    size={38}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-negro">
                    {r.name}
                  </span>
                  <span className="font-display text-lg font-bold text-marino">
                    {r.points}
                    <span className="ml-1 text-[11px] font-semibold text-gris">
                      pts
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Historial de ganadores */}
      <div>
        <h2 className="eyebrow mb-2 px-1">Historial de ganadores</h2>
        {winners.length === 0 ? (
          <div className="card p-5 text-center text-sm text-gris">
            Todavía no hay ganadores.
          </div>
        ) : (
          <div className="space-y-2">
            {winners.map((w) => (
              <div key={w.monthKey} className="card flex items-center gap-3 p-3">
                <Trophy size={18} className="text-dorado" />
                <PlayerAvatar
                  photo={w.photo}
                  firstName={w.name.split(" ")[0] ?? ""}
                  lastName={w.name.split(" ").slice(1).join(" ")}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-negro">{w.name}</p>
                  <p className="text-xs capitalize text-gris">
                    {monthLabel(w.monthKey)}
                  </p>
                </div>
                <span className="font-semibold text-marino">{w.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
