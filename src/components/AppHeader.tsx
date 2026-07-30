"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Crest } from "@/components/Crest";

export function AppHeader({ roleLabel }: { roleLabel: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-marino px-4 py-3 text-beige">
      <div className="flex items-center gap-3">
        <Crest size={36} />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold tracking-wide">
            CD Gaztelueta
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-dorado">
            {roleLabel}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        aria-label="Cerrar sesión"
        className="rounded-lg p-2 text-beige/80 transition hover:bg-blanco/10 hover:text-beige"
      >
        <LogOut size={20} />
      </button>
    </header>
  );
}
