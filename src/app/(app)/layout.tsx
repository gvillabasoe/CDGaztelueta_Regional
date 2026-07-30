import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const roleLabel = session.role === "COACH" ? "Entrenador" : "Jugador";
  return <AppShell roleLabel={roleLabel}>{children}</AppShell>;
}
