import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { FichaForm } from "../FichaForm";

export const dynamic = "force-dynamic";

export default async function NuevaFichaPage() {
  const session = await getSession();
  if (!session || session.role !== "COACH") redirect("/equipo");

  return (
    <div className="space-y-4">
      <Link
        href="/equipo"
        className="inline-flex items-center gap-1 text-sm text-gris hover:text-negro"
      >
        <ChevronLeft size={16} /> Mi Equipo
      </Link>
      <h1 className="font-display text-2xl font-semibold text-negro">
        Crear ficha
      </h1>
      <FichaForm mode="create" />
    </div>
  );
}
