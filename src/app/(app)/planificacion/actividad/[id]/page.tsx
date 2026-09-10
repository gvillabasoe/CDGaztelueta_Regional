import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Clock,
  MapPin,
  CalendarDays,
  Users,
  Dumbbell,
  Trophy,
  FileText,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  pendingPdfActivityIds,
  getActivitySafe,
  currentPlayer,
} from "@/lib/queries";
import { isTrainingAttendanceClosed } from "@/lib/deadlines";
import { formatDateLong, formatDateTimeShort } from "@/lib/format";
import { AttendancePanel } from "./AttendancePanel";
import { ExercisesEditor } from "./ExercisesEditor";
import { ExerciseList } from "./ExerciseList";
import { ScoringManager } from "./ScoringManager";
import { PdfManager } from "./PdfManager";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  // Nunca lanza: si algo falla, devuelve una versión reducida marcada como
  // degradada para que la pantalla se abra igualmente.
  const { activity, degraded } = await getActivitySafe(params.id);
  if (!activity) notFound();
  // Los jugadores solo ven actividades de planificaciones publicadas.
  if (!isCoach && !activity.plan.published) redirect("/planificacion");

  const me = isCoach ? null : await currentPlayer();
  // Clave del miembro que corresponde al usuario: jugador o cuerpo técnico.
  const myPlayerId = me
    ? `p:${me.id}`
    : session
      ? `s:${session.userId}`
      : null;

  const roster = await prisma.player.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, photo: true },
  });

  // ¿Tiene ESTE usuario el PDF de esta sesión sin consultar?
  let pdfPendingHere = false;
  try {
    pdfPendingHere = (await pendingPdfActivityIds()).has(activity.id);
  } catch (err) {
    // Un fallo del sistema de documentos no impide ver la actividad.
    console.error("pdfPendingHere", activity.id, err);
  }

  const rosterLite = roster.map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
  }));
  const exIds = activity.exercises.map((e) => e.id);
  let leagueEntries: {
    exerciseId: string | null;
    playerId: string;
    points: number;
    note: string | null;
  }[] = [];
  if (isCoach && exIds.length) {
    try {
      leagueEntries = await prisma.leaguePointEntry.findMany({
        where: { exerciseId: { in: exIds } },
        select: { exerciseId: true, playerId: true, points: true, note: true },
      });
    } catch (err) {
      console.error("leagueEntries", err);
    }
  }
  const entriesByExercise: Record<
    string,
    { playerId: string; points: number; note: string | null }[]
  > = {};
  for (const e of leagueEntries) {
    if (!e.exerciseId) continue;
    (entriesByExercise[e.exerciseId] ??= []).push({
      playerId: e.playerId,
      points: e.points,
      note: e.note,
    });
  }

  const attMap = new Map(
    activity.attendance
      .filter((a) => a.playerId)
      .map((a) => [a.playerId as string, a]),
  );
  const staffAttMap = new Map(
    activity.attendance
      .filter((a) => a.staffUserId)
      .map((a) => [a.staffUserId as string, a]),
  );
  const attendancePlayers = roster.map((p) => {
    const r = attMap.get(p.id);
    return {
      id: `p:${p.id}`,
      firstName: p.firstName,
      lastName: p.lastName,
      photo: p.photo,
      status: (r?.status ?? "GOING") as "GOING" | "NOT_GOING",
      reason: (r?.reason ?? null) as string | null,
      explanation: r?.explanation ?? null,
      outOfTime: r?.outOfTime ?? false,
      // Auditoría existente (solo se muestra al entrenador).
      modifiedByName: r?.modifiedByName ?? null,
      modifiedAtLabel: r?.modifiedAt ? formatDateTimeShort(r.modifiedAt) : null,
    };
  });

  // En la cena de equipo la asistencia incluye al cuerpo técnico convocado.
  if (isDinner) {
    try {
    const staff = await prisma.user.findMany({
      where: { role: "COACH" },
      orderBy: [{ displayName: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        displayName: true,
        nickname: true,
        photo: true,
      },
    });
    for (const u of staff) {
      const r = staffAttMap.get(u.id);
      attendancePlayers.push({
        id: `s:${u.id}`,
        firstName:
          u.nickname?.trim() || u.displayName?.trim() || u.username,
        lastName: "",
        photo: u.photo,
        status: (r?.status ?? "GOING") as "GOING" | "NOT_GOING",
        reason: (r?.reason ?? null) as string | null,
        explanation: r?.explanation ?? null,
        outOfTime: r?.outOfTime ?? false,
        modifiedByName: r?.modifiedByName ?? null,
        modifiedAtLabel: r?.modifiedAt
          ? formatDateTimeShort(r.modifiedAt)
          : null,
      });
    }
    } catch (err) {
      // Si falla la carga del cuerpo técnico, la cena se abre igualmente con
      // los jugadores.
      console.error("staff de la cena", activity.id, err);
    }
  }

  const isMatch = activity.type === "MATCH";
  const isDinner = activity.type === "DINNER";
  const attendanceClosed =
    activity.type === "TRAINING" && isTrainingAttendanceClosed(activity.date);
  const calledIds = new Set(activity.calledPlayers.map((p) => p.id));
  const called = roster.filter((p) => calledIds.has(p.id));
  const hasRecord = isMatch ? !!activity.matchRecord : !!activity.trainingRecord;
  const recordHref = isMatch
    ? `/planificacion/actividad/${activity.id}/partido`
    : `/planificacion/actividad/${activity.id}/entrenamiento`;

  return (
    <div className="space-y-5">
      <Link
        href="/planificacion"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Planificación
      </Link>

      {/* Cabecera */}
      <div className="card overflow-hidden">
        <div
          className={
            "flex items-center gap-2 px-4 py-2.5 text-beige " +
            (isMatch ? "bg-dorado text-marino" : "bg-marino")
          }
        >
          {isMatch ? <Trophy size={16} /> : <Dumbbell size={16} />}
          <span className="text-xs font-bold uppercase tracking-[0.18em]">
            {isMatch ? "Partido" : "Entrenamiento"}
          </span>
        </div>
        <div className="space-y-2 p-4 text-sm text-negro">
          {isMatch && (
            <p className="font-display text-xl font-semibold">
              CD Gaztelueta {activity.kitLocal ? "vs" : "@"}{" "}
              {activity.opponent || "—"}
            </p>
          )}
          <p className="flex items-center gap-2 capitalize">
            <CalendarDays size={15} className="text-gris" />
            {formatDateLong(activity.date)}
          </p>
          <p className="flex items-center gap-2">
            <Clock size={15} className="text-gris" />
            {activity.startTime}
            {activity.endTime ? `–${activity.endTime}` : ""}
            {isMatch && activity.callTime
              ? ` · Convocatoria ${activity.callTime}`
              : ""}
          </p>
          {activity.place && (
            <p className="flex items-center gap-2">
              <MapPin size={15} className="text-gris" />
              {activity.place}
            </p>
          )}
          {isMatch && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activity.matchday != null && (
                <span className="chip bg-marino/10 text-marino">
                  Jornada {activity.matchday}
                </span>
              )}
              <span className="chip bg-beige text-negro">
                Equipación {activity.kitLocal ? "local" : "visitante"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Convocatoria (partido) */}
      {isMatch && (
        <section className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users size={16} className="text-marino" />
            <h2 className="font-semibold text-negro">
              Convocatoria{" "}
              <span className="text-sm font-normal text-gris">
                ({called.length}/18)
              </span>
            </h2>
          </div>
          {called.length === 0 ? (
            <p className="text-sm text-gris">Sin jugadores convocados.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {called.map((p) => (
                <span key={p.id} className="chip bg-marino/10 text-marino">
                  {p.firstName} {p.lastName}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {degraded && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm text-negro">
          Algunos datos de esta actividad no se han podido cargar. Se muestra la
          información disponible.
        </p>
      )}

      {isDinner && (
        <section className="card border-l-4 border-[#6D28D9] p-4">
          <p className="chip mb-2 bg-[#6D28D9]/15 text-[11px] font-bold text-[#5B21B6]">
            <span aria-hidden>🎉</span> JORNADA NOCTURNA
          </p>
          <h2 className="font-display text-lg font-semibold text-negro">
            <span aria-hidden>🎉</span>{" "}
            <span className="sr-only">Cena de equipo:</span>
            Cena de equipo
          </h2>
          <dl className="mt-2 space-y-1 text-sm">
            {activity.callTime && (
              <div className="flex gap-2">
                <dt className="text-gris">Hora de convocatoria:</dt>
                <dd className="font-medium text-negro">{activity.callTime}</dd>
              </div>
            )}
            {activity.dinnerPlace && (
              <div className="flex gap-2">
                <dt className="shrink-0 text-gris">Lugar de la cena:</dt>
                <dd className="break-words font-medium text-negro">
                  {activity.dinnerPlace}
                </dd>
              </div>
            )}
            {activity.afterPlace && (
              <div className="flex gap-2">
                <dt className="shrink-0 text-gris">Después de la cena:</dt>
                <dd className="break-words font-medium text-negro">
                  {activity.afterPlace}
                </dd>
              </div>
            )}
          </dl>
          {activity.notes && (
            <p className="mt-2 whitespace-pre-line rounded-lg bg-beige px-3 py-2 text-sm text-negro">
              {activity.notes}
            </p>
          )}
          {activity.pollEnabled && (
            <p className="mt-2 inline-block rounded-lg bg-[#6D28D9]/15 px-2.5 py-1 text-[11px] font-bold text-[#5B21B6]">
              ⭐ EVENTO PUNTUABLE PARA JUGADOR DEL MES
            </p>
          )}
          <p className="mt-2 text-xs text-gris">
            Convocatoria: TODOS CONVOCADOS (plantilla y cuerpo técnico).
          </p>
        </section>
      )}

      {/* Documento (PDF): disponible en entrenamientos Y partidos */}
      {!isDinner && (
      <section className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText size={16} className="text-marino" />
          <h2 className="font-semibold text-negro">
            {isMatch ? "Documento del partido (PDF)" : "Documento (PDF)"}
          </h2>
        </div>
        {isMatch && isCoach && (
          <p className="mb-2 text-xs text-gris">
            Adjunta la convocatoria, el plan de partido, información del rival,
            horarios o el punto de encuentro.
          </p>
        )}
        <PdfManager
          activityId={activity.id}
          isCoach={isCoach}
          fileName={activity.fileName}
          pdfPending={pdfPendingHere}
        />
      </section>
      )}

      {/* Ejercicios: solo entrenamiento */}
      {!isMatch && (
        <>

          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Dumbbell size={16} className="text-marino" />
              <h2 className="font-semibold text-negro">Ejercicios</h2>
            </div>
            {isCoach ? (
              <>
                <ExercisesEditor
                  activityId={activity.id}
                  initial={activity.exercises.map((e) => ({
                    id: e.id,
                    task: e.task,
                    description: e.description,
                    objective: e.objective,
                    duration: e.duration,
                    scorable: e.scorable,
                    maxPoints: e.maxPoints,
                    scoringInfo: e.scoringInfo,
                  }))}
                />
                {activity.exercises.length > 0 && (
                  <div className="mt-4 border-t border-gris/10 pt-4">
                    <p className="eyebrow mb-2">Puntuación y archivos</p>
                    <ScoringManager
                      roster={rosterLite}
                      entriesByExercise={entriesByExercise}
                      exercises={activity.exercises.map((e) => ({
                        id: e.id,
                        task: e.task,
                        scorable: e.scorable,
                        maxPoints: e.maxPoints,
                        hasFile: !!e.exFileName,
                        fileName: e.exFileName,
                      }))}
                    />
                  </div>
                )}
              </>
            ) : (
              <ExerciseList
                exercises={activity.exercises.map((e) => ({
                  id: e.id,
                  task: e.task,
                  description: e.description,
                  objective: e.objective,
                  duration: e.duration,
                  scorable: e.scorable,
                  maxPoints: e.maxPoints,
                  scoringInfo: e.scoringInfo,
                  hasFile: !!e.exFileName,
                  fileName: e.exFileName,
                }))}
              />
            )}
          </section>
        </>
      )}

      {/* Confirmación de asistencia */}
      <section className="card p-4">
        <h2 className="mb-3 font-semibold text-negro">Asistencia</h2>
        <AttendancePanel
          activityId={activity.id}
          isCoach={isCoach}
          myPlayerId={myPlayerId}
          players={attendancePlayers}
          isTraining={!isMatch}
          closed={attendanceClosed}
        />
      </section>

      {/* Registro posterior (solo entrenador) */}
      {isCoach && (
        <Link href={recordHref} className="btn-primary w-full">
          {hasRecord ? <Pencil size={16} /> : <ClipboardList size={16} />}
          {hasRecord
            ? "Editar registro"
            : isMatch
              ? "Registrar partido"
              : "Registrar entrenamiento"}
        </Link>
      )}
    </div>
  );
}
