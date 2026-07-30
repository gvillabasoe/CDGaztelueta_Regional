"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, MessageSquare } from "lucide-react";
import {
  PROPOSAL_STATUSES,
  PROPOSAL_LABEL,
  PROPOSAL_BADGE,
} from "@/lib/labels";
import {
  createProposal,
  respondProposal,
  setProposalStatus,
  deleteProposal,
} from "@/actions/proposal";
import type { ProposalStatus } from "@/lib/types";

type P = {
  id: string;
  authorName: string;
  dateLong: string;
  title: string;
  message: string;
  response: string | null;
  status: ProposalStatus;
};

export function PropuestasView({
  isCoach,
  isPlayer,
  proposals,
}: {
  isCoach: boolean;
  isPlayer: boolean;
  proposals: P[];
}) {
  const router = useRouter();

  const [creating, setCreating] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    const res = await createProposal({ title, message });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setTitle("");
    setMessage("");
    setCreating(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-negro">
          Propuestas
        </h1>
        {isPlayer && !creating && (
          <button className="btn-gold" onClick={() => setCreating(true)}>
            <Plus size={16} /> Nueva
          </button>
        )}
      </div>

      {isPlayer && creating && (
        <div className="card p-4">
          <p className="eyebrow mb-3">Nueva propuesta</p>
          <div className="space-y-3">
            <div>
              <label className="label">Título</label>
              <input
                className="field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Mensaje</label>
              <textarea
                className="field"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          {err && (
            <p className="mt-3 rounded-lg bg-amarillo/25 px-3 py-2 text-sm">
              {err}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1" onClick={submit} disabled={busy}>
              {busy && <Loader2 size={16} className="animate-spin" />} Publicar
            </button>
            <button className="btn-ghost" onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="card p-6 text-center text-sm text-gris">
          Todavía no hay propuestas.
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-negro">{p.title}</p>
                  <p className="text-xs text-gris">
                    {p.authorName} · {p.dateLong}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                    PROPOSAL_BADGE[p.status]
                  }
                >
                  {PROPOSAL_LABEL[p.status]}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-negro/90">
                {p.message}
              </p>

              {p.response && (
                <div className="mt-3 rounded-xl bg-beige p-3">
                  <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-dorado">
                    <MessageSquare size={12} /> Respuesta del entrenador
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-negro/90">
                    {p.response}
                  </p>
                </div>
              )}

              {isCoach && <ProposalAdmin proposal={p} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalAdmin({ proposal }: { proposal: P }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [response, setResponse] = React.useState(proposal.response ?? "");
  const [status, setStatus] = React.useState<ProposalStatus>(proposal.status);
  const [busy, setBusy] = React.useState(false);

  async function saveResponse() {
    setBusy(true);
    await respondProposal(proposal.id, { response, status });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }
  async function quickStatus(s: ProposalStatus) {
    setBusy(true);
    await setProposalStatus(proposal.id, s);
    setBusy(false);
    router.refresh();
  }
  async function remove() {
    if (!confirm("¿Eliminar esta propuesta?")) return;
    setBusy(true);
    await deleteProposal(proposal.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-gris/10 pt-3">
      {!open ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-ghost px-3 py-1.5 text-xs"
            onClick={() => setOpen(true)}
            disabled={busy}
          >
            Responder
          </button>
          <select
            className="field w-auto px-2 py-1.5 text-xs"
            value={proposal.status}
            onChange={(e) => quickStatus(e.target.value as ProposalStatus)}
            disabled={busy}
          >
            {PROPOSAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROPOSAL_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            className="ml-auto rounded-lg p-1.5 text-red-600 hover:bg-red-50"
            onClick={remove}
            disabled={busy}
            aria-label="Eliminar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="field"
            rows={2}
            placeholder="Escribe una respuesta…"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <select
            className="field"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProposalStatus)}
          >
            {PROPOSAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROPOSAL_LABEL[s]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 py-2 text-xs"
              onClick={saveResponse}
              disabled={busy}
            >
              {busy && <Loader2 size={14} className="animate-spin" />} Guardar
            </button>
            <button
              className="btn-ghost py-2 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
