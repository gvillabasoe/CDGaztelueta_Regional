"use client";

import * as React from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import type { NewFineInput, PlayerLite } from "@/lib/types";

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

type Block = {
  key: string;
  playerIds: string[];
  date: string;
  concept: string;
  amount: string;
};

let c = 0;
const uid = () => `f${Date.now()}_${c++}`;

// Añade multas nuevas durante el registro (se crean en el apartado central Multas).
export function FinesAdder({
  players,
  onChange,
}: {
  players: PlayerLite[];
  onChange: (fines: NewFineInput[]) => void;
}) {
  const [blocks, setBlocks] = React.useState<Block[]>([]);

  function emit(next: Block[]) {
    setBlocks(next);
    onChange(
      next.map((b) => ({
        playerIds: b.playerIds,
        date: b.date,
        concept: b.concept,
        amount: parseFloat(b.amount.replace(",", ".")) || 0,
      })),
    );
  }
  function add() {
    emit([
      ...blocks,
      { key: uid(), playerIds: [], date: today(), concept: "", amount: "" },
    ]);
  }
  function patch(key: string, p: Partial<Block>) {
    emit(blocks.map((b) => (b.key === key ? { ...b, ...p } : b)));
  }
  function remove(key: string) {
    emit(blocks.filter((b) => b.key !== key));
  }
  function togglePlayer(key: string, pid: string) {
    const b = blocks.find((x) => x.key === key);
    if (!b) return;
    const has = b.playerIds.includes(pid);
    patch(key, {
      playerIds: has
        ? b.playerIds.filter((i) => i !== pid)
        : [...b.playerIds, pid],
    });
  }

  return (
    <div className="space-y-3">
      {blocks.map((b) => (
        <div key={b.key} className="rounded-xl border border-gris/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-gris">
              <Wallet size={13} /> Multa
            </span>
            <button
              onClick={() => remove(b.key)}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              aria-label="Quitar multa"
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {players.map((p) => {
              const on = b.playerIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlayer(b.key, p.id)}
                  className={
                    "chip border " +
                    (on
                      ? "border-marino bg-marino text-blanco"
                      : "border-gris/30 bg-blanco text-negro")
                  }
                >
                  {p.firstName} {p.lastName}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Importe (€)</label>
              <input
                className="field"
                inputMode="decimal"
                value={b.amount}
                onChange={(e) => patch(b.key, { amount: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="field"
                value={b.date}
                onChange={(e) => patch(b.key, { date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Motivo</label>
              <input
                className="field"
                value={b.concept}
                onChange={(e) => patch(b.key, { concept: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button className="btn-ghost w-full" onClick={add}>
        <Plus size={16} /> Añadir multa
      </button>
    </div>
  );
}
