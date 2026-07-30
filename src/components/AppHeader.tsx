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
    <header className="sticky top-0 z-20 bg-marino px-4 py-2.5 text-beige">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Crest size={34} />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-base font-semibold tracking-wide">
              CD Gaztelueta
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-dorado">
              {roleLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          className="shrink-0 rounded-lg p-2 text-beige/80 transition hover:bg-blanco/10 hover:text-beige"
        >
          <LogOut size={20} />
        </button>
      </div>
      <p className="mt-1.5 text-center font-display text-sm italic tracking-wide text-beige/90">
        Como en casa, en ningún lado
      </p>
    </header>
  );
}
