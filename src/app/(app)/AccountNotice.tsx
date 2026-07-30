"use client";

import { useRouter } from "next/navigation";
import { Crest } from "@/components/Crest";

export function AccountNotice({ status }: { status: "PENDING" | "INACTIVE" }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  const msg =
    status === "PENDING"
      ? "Tu cuenta se ha creado, pero tu ficha está pendiente de que el entrenador la revise y la active. Vuelve a intentarlo más tarde."
      : "Tu ficha está inactiva (baja). Si crees que es un error, contacta con el entrenador.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-marino px-6 py-10 text-center text-beige">
      <div className="rounded-2xl bg-blanco p-2 shadow-card">
        <Crest size={72} />
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold">CD Gaztelueta</h1>
      <p className="mt-4 max-w-sm text-sm text-beige/90">{msg}</p>
      <button
        onClick={logout}
        className="mt-6 rounded-lg bg-blanco/10 px-4 py-2 text-sm font-semibold text-beige hover:bg-blanco/20"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
