import * as React from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({
  role,
  subtitle,
  children,
}: {
  role: "coach" | "player";
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader subtitle={subtitle} />
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4">{children}</main>
      <BottomNav role={role} />
    </>
  );
}
