import * as React from "react";
import { AppShell } from "@/components/AppShell";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell role="coach" subtitle="Entrenador">
      {children}
    </AppShell>
  );
}
