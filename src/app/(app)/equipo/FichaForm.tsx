"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { Switch } from "@/components/Switch";
import { PhotoPicker } from "@/components/PhotoPicker";
import { POSITIONS } from "./positions";
import { createPlayer, updatePlayer } from "@/actions/player";
import type { PlayerFichaInput, PlayerEditInput } from "@/lib/types";

export type FichaData = {
  firstName: string;
  lastName: string;
  nickname: string | null;
  number: number | null;
  age: number | null;
  isCaptain: boolean;
  positions: string[];
  photo: string | null;
  callups: number;
  minutes: number;
  starts: number;
  benchCount: number;
  goalsCount: number;
};

const empty: FichaData = {
  firstName: "",
  lastName: "",
  nickname: "",
  number: null,
  age: null,
  isCaptain: false,
  positions: [],
  photo: null,
  callups: 0,
  minutes: 0,
  starts: 0,
  benchCount: 0,
  goalsCount: 0,
};

const intOrNull = (s: string) => {
  const v = parseInt(s, 10);
  return Number.isFinite(v) ? v : null;
};
const int0 = (s: string) => {
  const v = parseInt(s, 10);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

export function FichaForm({
  mode,
  playerId,
  initial,
}: {
  mode: "create" | "edit";
  playerId?: string;
  initial?: FichaData;
}) {
  const router = useRouter();
  const start = initial ?? empty;

  const [firstName, setFirstName] = React.useState(start.firstName);
  const [lastName, setLastName] = React.useState(start.lastName);
  const [nickname, setNickname] = React.useState(start.nickname ?? "");
  const [number, setNumber] = React.useState(
    start.number != null ? String(start.number) : "",
  );
  const [age, setAge] = React.useState(start.age != null ? String(start.age) : "");
  const [isCaptain, setIsCaptain] = React.useState(start.isCaptain);
  const [multi, setMulti] = React.useState(start.positions.length > 1);
  const [positions, setPositions] = React.useState<string[]>(start.positions);
  const [photo, setPhoto] = React.useState<string | null>(start.photo);

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [callups, setCallups] = React.useState(String(start.callups));
  const [minutes, setMinutes] = React.useState(String(start.minutes));
  const [starts, setStarts] = React.useState(String(start.starts));
  const [benchCount, setBenchCount] = React.useState(String(start.benchCount));
  const [goalsCount, setGoalsCount] = React.useState(String(start.goalsCount));

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  function toggleMulti(v: boolean) {
    setMulti(v);
    if (!v && positions.length > 1) setPositions(positions.slice(0, 1));
  }
  function setSingle(pos: string) {
    setPositions(pos ? [pos] : []);
  }
  function togglePos(pos: string) {
    setPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos],
    );
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setOkMsg(null);

    if (mode === "create") {
      const payload: PlayerFichaInput = {
        firstName,
        lastName,
        nickname: nickname.trim() || null,
        number: intOrNull(number),
        age: intOrNull(age),
        isCaptain,
        positions,
        photo,
        username,
        password,
      };
      const res = await createPlayer(payload);
      setSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/equipo");
      router.refresh();
    } else {
      const payload: PlayerEditInput = {
        firstName,
        lastName,
        nickname: nickname.trim() || null,
        number: intOrNull(number),
        age: intOrNull(age),
        isCaptain,
        positions,
        photo,
        callups: int0(callups),
        minutes: int0(minutes),
        starts: int0(starts),
        benchCount: int0(benchCount),
        goalsCount: int0(goalsCount),
      };
      const res = await updatePlayer(playerId!, payload);
      setSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOkMsg("Ficha actualizada.");
      router.refresh();
    }
  }

  const statFields: [string, string, (v: string) => void][] = [
    ["Convocatorias", callups, setCallups],
    ["Minutos jugados", minutes, setMinutes],
    ["Titularidades", starts, setStarts],
    ["Suplencias", benchCount, setBenchCount],
    ["Goles", goalsCount, setGoalsCount],
  ];

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="mb-4 flex justify-center">
          <PhotoPicker value={photo} onChange={setPhoto} size={104} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nombre *</label>
            <input
              className="field"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Apellidos *</label>
            <input
              className="field"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Mote</label>
            <input
              className="field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Dorsal</label>
            <input
              className="field"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Edad</label>
            <input
              className="field"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-beige px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Star size={16} className="text-dorado" /> Capitán
          </span>
          <Switch checked={isCaptain} onChange={setIsCaptain} label="Capitán" />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-beige px-3 py-2.5">
          <span className="text-sm font-medium">Múltiples posiciones</span>
          <Switch
            checked={multi}
            onChange={toggleMulti}
            label="Múltiples posiciones"
          />
        </div>

        <div className="mt-3">
          <label className="label">Posición{multi ? "es" : ""}</label>
          {!multi ? (
            <select
              className="field"
              value={positions[0] ?? ""}
              onChange={(e) => setSingle(e.target.value)}
            >
              <option value="">Sin especificar</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => {
                const on = positions.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePos(p)}
                    className={
                      "chip border " +
                      (on
                        ? "border-marino bg-marino text-blanco"
                        : "border-gris/30 bg-blanco text-negro")
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {mode === "create" && (
        <div className="card p-5">
          <p className="eyebrow mb-3">Cuenta del jugador</p>
          <div className="space-y-3">
            <div>
              <label className="label">Usuario *</label>
              <input
                className="field"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contraseña inicial *</label>
              <input
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <p className="text-xs text-gris">
              El jugador podrá iniciar sesión con estas credenciales. La
              contraseña no se mostrará después.
            </p>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="card p-5">
          <p className="eyebrow mb-3">Estadísticas (manuales)</p>
          <div className="grid grid-cols-2 gap-3">
            {statFields.map(([lbl, val, set]) => (
              <div key={lbl}>
                <label className="label">{lbl}</label>
                <input
                  className="field"
                  inputMode="numeric"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">{error}</p>
      )}
      {okMsg && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
          {okMsg}
        </p>
      )}

      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={submit} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {mode === "create" ? "Crear ficha" : "Guardar cambios"}
        </button>
        <button
          className="btn-ghost"
          onClick={() => router.push("/equipo")}
          disabled={saving}
        >
          {mode === "create" ? "Cancelar" : "Volver"}
        </button>
      </div>
    </div>
  );
}
