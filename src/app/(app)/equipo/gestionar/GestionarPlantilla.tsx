"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Unlink,
  Merge,
  Mail,
} from "lucide-react";
import {
  setPlayerStatus,
  deletePlayer,
  unlinkAccount,
  changePlayerEmail,
  mergePlayers,
} from "@/actions/plantilla";

type Status = "ACTIVE" | "INACTIVE" | "PENDING";
type MP = {
  id: string;
  name: string;
  status: Status;
  number: number | null;
  hasAccount: boolean;
  account: string | null;
  email: string | null;
  hasHistory: boolean;
};

const STATUS_LABEL: Record<Status, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  PENDING: "Pendiente",
};
const STATUS_CLS: Record<Status, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gris/20 text-gris",
  PENDING: "bg-amarillo/30 text-negro",
};

export function GestionarPlantilla({ players }: { players: MP[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const pending = players.filter((p) => p.status === "PENDING");
  const active = players.filter((p) => p.status === "ACTIVE");
  const inactive = players.filter((p) => p.status === "INACTIVE");

  async function run(id: string, fn: () => Promise<{ ok: boolean }>) {
    setBusy(id);
    await fn();
    setBusy(null);
    router.refresh();
  }

  async function onDelete(p: MP) {
    const res = await deletePlayer(p.id, false);
    if (!res.ok && "needsConfirm" in res && res.needsConfirm) {
      if (!confirm(res.error)) return;
      await run(p.id, () => deletePlayer(p.id, true));
      return;
    }
    if (!res.ok) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  async function onEmail(p: MP) {
    const email = prompt("Correo del jugador:", p.email ?? "");
    if (email === null) return;
    setBusy(p.id);
    const res = await changePlayerEmail(p.id, email);
    setBusy(null);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  function Row({ p }: { p: MP }) {
    return (
      <div className="card p-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-negro">
              {p.number != null ? `#${p.number} ` : ""}
              {p.name}
            </p>
            <p className="truncate text-xs text-gris">
              {p.hasAccount
                ? `Cuenta: ${p.account ?? p.email ?? "vinculada"}`
                : p.email
                  ? `Sin cuenta · ${p.email}`
                  : "Sin cuenta"}
            </p>
          </div>
          <span
            className={
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
              STATUS_CLS[p.status]
            }
          >
            {STATUS_LABEL[p.status]}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.status === "PENDING" && (
            <button
              className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              disabled={busy === p.id}
              onClick={() => run(p.id, () => setPlayerStatus(p.id, "ACTIVE"))}
            >
              <Check size={13} className="mr-1 inline" />
              Validar / Activar
            </button>
          )}
          {p.status === "ACTIVE" && (
            <button
              className="rounded-lg border border-gris/30 px-2.5 py-1.5 text-xs font-semibold text-negro disabled:opacity-50"
              disabled={busy === p.id}
              onClick={() => run(p.id, () => setPlayerStatus(p.id, "INACTIVE"))}
            >
              Dar de baja
            </button>
          )}
          {p.status === "INACTIVE" && (
            <button
              className="rounded-lg bg-marino px-2.5 py-1.5 text-xs font-semibold text-blanco disabled:opacity-50"
              disabled={busy === p.id}
              onClick={() => run(p.id, () => setPlayerStatus(p.id, "ACTIVE"))}
            >
              Reactivar
            </button>
          )}

          <Link
            href={`/equipo/${p.id}`}
            className="rounded-lg border border-gris/30 px-2.5 py-1.5 text-xs font-semibold text-marino"
          >
            <Pencil size={13} className="mr-1 inline" />
            Editar
          </Link>

          <button
            className="rounded-lg border border-gris/30 px-2.5 py-1.5 text-xs font-semibold text-marino"
            onClick={() => onEmail(p)}
          >
            <Mail size={13} className="mr-1 inline" />
            Correo
          </button>

          {p.hasAccount && (
            <button
              className="rounded-lg border border-gris/30 px-2.5 py-1.5 text-xs font-semibold text-negro disabled:opacity-50"
              disabled={busy === p.id}
              onClick={() => run(p.id, () => unlinkAccount(p.id))}
            >
              <Unlink size={13} className="mr-1 inline" />
              Desvincular
            </button>
          )}

          <button
            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
            disabled={busy === p.id}
            onClick={() => onDelete(p)}
          >
            {busy === p.id ? (
              <Loader2 size={13} className="mr-1 inline animate-spin" />
            ) : (
              <Trash2 size={13} className="mr-1 inline" />
            )}
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-negro">
          Gestionar plantilla
        </h1>
        <Link href="/equipo/nueva" className="btn-gold shrink-0">
          <UserPlus size={16} /> Crear ficha
        </Link>
      </div>

      {pending.length > 0 && (
        <div>
          <div className="mb-2 rounded-xl bg-amarillo/25 px-3 py-2 text-sm text-negro">
            {pending.length} ficha{pending.length === 1 ? "" : "s"} pendiente
            {pending.length === 1 ? "" : "s"} de revisión (registros de jugadores
            sin ficha previa). Revísalas, complétalas o fusiónalas.
          </div>
          <h2 className="eyebrow mb-2 px-1">Pendientes de revisión</h2>
          <div className="space-y-2">
            {pending.map((p) => (
              <Row key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="eyebrow mb-2 px-1">Activos ({active.length})</h2>
        <div className="space-y-2">
          {active.map((p) => (
            <Row key={p.id} p={p} />
          ))}
          {active.length === 0 && (
            <p className="text-sm text-gris">Sin jugadores activos.</p>
          )}
        </div>
      </div>

      {inactive.length > 0 && (
        <div>
          <h2 className="eyebrow mb-2 px-1">Inactivos ({inactive.length})</h2>
          <div className="space-y-2">
            {inactive.map((p) => (
              <Row key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      <MergePanel players={players} />
    </div>
  );
}

function MergePanel({ players }: { players: MP[] }) {
  const router = useRouter();
  const [keep, setKeep] = React.useState("");
  const [merge, setMerge] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function doMerge() {
    setMsg(null);
    if (!keep || !merge || keep === merge) {
      setMsg("Elige la ficha principal y la duplicada (distintas).");
      return;
    }
    const kName = players.find((p) => p.id === keep)?.name;
    const mName = players.find((p) => p.id === merge)?.name;
    if (
      !confirm(
        `Se fusionará "${mName}" dentro de "${kName}". Se conservará todo el historial en la principal y la duplicada se eliminará. ¿Continuar?`,
      )
    )
      return;
    setBusy(true);
    const res = await mergePlayers(keep, merge);
    setBusy(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setKeep("");
    setMerge("");
    router.refresh();
  }

  return (
    <div className="card p-4">
      <p className="eyebrow mb-1 flex items-center gap-1.5">
        <Merge size={14} /> Fusionar fichas duplicadas
      </p>
      <p className="mb-3 text-xs text-gris">
        Une dos fichas de la misma persona. La cuenta y el historial de la
        duplicada pasan a la principal.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Ficha principal</label>
          <select
            className="field"
            value={keep}
            onChange={(e) => setKeep(e.target.value)}
          >
            <option value="">—</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ficha duplicada</label>
          <select
            className="field"
            value={merge}
            onChange={(e) => setMerge(e.target.value)}
          >
            <option value="">—</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {msg && (
        <p className="mt-2 rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{msg}</p>
      )}
      <button
        className="btn-primary mt-3 w-full"
        onClick={doMerge}
        disabled={busy}
      >
        {busy && <Loader2 size={16} className="animate-spin" />} Fusionar
      </button>
    </div>
  );
}
