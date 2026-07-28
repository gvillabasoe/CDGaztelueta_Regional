import * as React from "react";
import { AppShell } from "@/components/AppShell";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell role="player" subtitle="Jugador">
      {children}
    </AppShell>
  );
}
