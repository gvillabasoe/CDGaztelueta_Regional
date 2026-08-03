"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/Switch";
import { setCanVote } from "@/actions/poll";

export function VotePermissions({
  coaches,
}: {
  coaches: { id: string; username: string; canVote: boolean }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function toggle(id: string, v: boolean) {
    setBusy(id);
    await setCanVote(id, v);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="card p-4">
      <p className="eyebrow mb-1">Permiso de voto (cuerpo técnico)</p>
      <p className="mb-3 text-xs text-gris">
        Define qué miembros del cuerpo técnico pueden votar en Jugador del Mes.
        Es un permiso distinto de la administración.
      </p>
      <div className="space-y-2">
        {coaches.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl bg-beige px-3 py-2.5"
          >
            <span className="text-sm font-medium text-negro">{c.username}</span>
            <Switch
              checked={c.canVote}
              onChange={(v) => toggle(c.id, v)}
              label="Puede votar"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
