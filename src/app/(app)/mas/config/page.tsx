import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TeamPhoto } from "@/components/TeamPhoto";
import { Crest } from "@/components/Crest";
import { ConfigForm } from "./ConfigForm";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const session = await getSession();
  const isCoach = session?.role === "COACH";
  const tp = await prisma.teamProfile.findUnique({ where: { id: 1 } });
  const name = tp?.name ?? "CD Gaztelueta";
  const info = tp?.info ?? "";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-negro">
        Configuración
      </h1>

      {isCoach ? (
        <ConfigForm initialName={name} initialInfo={info} />
      ) : (
        <div className="card space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-marino p-1.5">
              <Crest size={44} />
            </div>
            <p className="font-display text-lg font-semibold text-negro">
              {name}
            </p>
          </div>
          <TeamPhoto />
          {info ? (
            <p className="whitespace-pre-wrap text-sm text-negro/90">{info}</p>
          ) : (
            <p className="text-sm text-gris">Sin información adicional.</p>
          )}
        </div>
      )}

      <div className="card p-5">
        <p className="eyebrow mb-2">Cuenta</p>
        <p className="text-sm text-negro">
          Has iniciado sesión como{" "}
          <span className="font-semibold">@{session?.username}</span> (
          {isCoach ? "Entrenador" : "Jugador"}).
        </p>
        <p className="mt-1 text-xs text-gris">
          Puedes cerrar sesión con el icono de la parte superior derecha.
        </p>
      </div>
    </div>
  );
}
