import * as React from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({
  roleLabel,
  fineDebt = false,
  children,
}: {
  roleLabel: string;
  fineDebt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader roleLabel={roleLabel} />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4">{children}</main>
      <BottomNav fineDebt={fineDebt} />
    </>
  );
}
