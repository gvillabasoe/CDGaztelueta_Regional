import "server-only";
import { prisma } from "@/lib/prisma";

// Registra la consulta del PDF general de una sesión para UN usuario y la
// versión vigente. Idempotente: repetir la consulta no crea duplicados.
// Devuelve false si no hay documento (así un error o un archivo inexistente
// nunca marca nada como visto).
export async function registerActivityFileView(
  userId: string,
  activityId: string,
) {
  try {
    const act = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { fileName: true, fileVersion: true },
    });
    if (!act || !act.fileName) return false;

    await prisma.activityFileView.upsert({
      where: {
        userId_activityId_version: {
          userId,
          activityId,
          version: act.fileVersion,
        },
      },
      update: {},
      create: { userId, activityId, version: act.fileVersion },
    });
    return true;
  } catch (err) {
    console.error("registerActivityFileView", activityId, err);
    return false;
  }
}
