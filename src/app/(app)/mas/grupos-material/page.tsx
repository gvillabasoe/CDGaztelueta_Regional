import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { teamDocument } from "@/lib/queries";
import { formatDateTimeShort } from "@/lib/format";
import { DocumentSection } from "../DocumentSection";

export const dynamic = "force-dynamic";

export default async function GruposMaterialPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const isCoach = session.role === "COACH";

  const doc = await teamDocument("GRUPOS_MATERIAL");

  return (
    <div className="space-y-4">
      <Link
        href="/mas"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Más
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold text-negro">
          Grupos de Material
        </h1>
        <p className="mt-1 text-sm text-gris">
          Organización de los grupos encargados del material.
        </p>
      </div>

      <DocumentSection
        kind="GRUPOS_MATERIAL"
        isCoach={isCoach}
        fileName={doc?.fileName ?? null}
        updatedAtLabel={doc ? formatDateTimeShort(doc.updatedAt) : null}
      />
    </div>
  );
}
