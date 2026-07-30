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
import { getActivity, currentPlayer } from "@/lib/queries";
import { isTrainingAttendanceClosed } from "@/lib/deadlines";
import { formatDateLong } from "@/lib/format";
import { AttendancePanel } from "./AttendancePanel";
import { ExercisesEditor } from "./ExercisesEditor";
import { PdfManager } from "./PdfManager";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  const isCoach = session?.role === "COACH";

  const activity = await getActivity(params.id);
  if (!activity) notFound();
  // Los jugadores solo ven actividades de planificaciones publicadas.
  if (!isCoach && !activity.plan.published) redirect("/planificacion");

  const me = isCoach ? null : await currentPlayer();
  const myPlayerId = me?.id ?? null;

  const roster = await prisma.player.findMany({
    orderBy: [{ number: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, photo: true },
  });

  const attMap = new Map(activity.attendance.map((a) => [a.playerId, a]));
  const attendancePlayers = roster.map((p) => {
    const r = attMap.get(p.id);
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      photo: p.photo,
      status: (r?.status ?? "GOING") as "GOING" | "NOT_GOING",
      reason: (r?.reason ?? null) as string | null,
      explanation: r?.explanation ?? null,
      outOfTime: r?.outOfTime ?? false,
    };
  });

  const isMatch = activity.type === "MATCH";
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

      {/* Contenido del entrenamiento: PDF + ejercicios */}
      {!isMatch && (
        <>
          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText size={16} className="text-marino" />
              <h2 className="font-semibold text-negro">Documento (PDF)</h2>
            </div>
            <PdfManager
              activityId={activity.id}
              isCoach={isCoach}
              fileName={activity.fileName}
            />
          </section>

          <section className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Dumbbell size={16} className="text-marino" />
              <h2 className="font-semibold text-negro">Ejercicios</h2>
            </div>
            {isCoach ? (
              <ExercisesEditor
                activityId={activity.id}
                initial={activity.exercises.map((e) => ({
                  id: e.id,
                  task: e.task,
                  description: e.description,
                  objective: e.objective,
                  duration: e.duration,
                }))}
              />
            ) : activity.exercises.length === 0 ? (
              <p className="text-sm text-gris">
                Sin ejercicios publicados todavía.
              </p>
            ) : (
              <ol className="space-y-2">
                {activity.exercises.map((e, i) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-gris/20 p-3"
                  >
                    <p className="font-medium text-negro">
                      {i + 1}. {e.task}
                      {e.duration ? (
                        <span className="ml-2 text-xs font-normal text-gris">
                          · {e.duration}
                        </span>
                      ) : null}
                    </p>
                    {e.description && (
                      <p className="mt-1 text-sm text-negro/80">
                        {e.description}
                      </p>
                    )}
                    {e.objective && (
                      <p className="mt-1 text-xs text-gris">
                        Objetivo: {e.objective}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
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
