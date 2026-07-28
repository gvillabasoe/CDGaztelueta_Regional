"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Plus,
  X,
  Trash2,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Switch } from "@/components/Switch";
import { createPlayer } from "@/actions/player";

async function resizeToDataUrl(file: File, max = 256): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function CrearFicha() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [number, setNumber] = useState("");
  const [age, setAge] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [position, setPosition] = useState("");
  const [multi, setMulti] = useState(false);
  const [extraPositions, setExtraPositions] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setPhoto(null);
    setFirstName("");
    setLastName("");
    setNickname("");
    setNumber("");
    setAge("");
    setIsCaptain(false);
    setPosition("");
    setMulti(false);
    setExtraPositions([]);
    setUsername("");
    setPassword("");
    setError(null);
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await resizeToDataUrl(file);
    setPhoto(url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const positions = [position, ...(multi ? extraPositions : [])]
      .map((p) => p.trim())
      .filter(Boolean);

    const res = await createPlayer({
      firstName,
      lastName,
      nickname: nickname || null,
      number: number === "" ? null : parseInt(number),
      age: age === "" ? null : parseInt(age),
      isCaptain,
      positions,
      photo,
      username,
      password,
    });

    setSaving(false);
    if (res.ok) {
      resetForm();
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error || "No se ha podido crear la ficha.");
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-gold w-full"
        onClick={() => setOpen(true)}
      >
        <UserPlus size={18} /> Crear ficha
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-negro/40 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-beige p-5 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-marino">
                Crear ficha
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gris hover:bg-blanco hover:text-marino"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Foto estilo WhatsApp */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative h-24 w-24 overflow-hidden rounded-full bg-blanco ring-2 ring-dorado"
                  aria-label="Añadir fotografía"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt="Foto del jugador"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-gris">
                      <Camera size={30} />
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-marino text-beige ring-2 ring-beige">
                    <Camera size={15} />
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickPhoto}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="label">Nombre</span>
                  <input
                    className="field"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <span className="label">Apellidos</span>
                  <input
                    className="field"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <span className="label">Mote</span>
                <input
                  className="field"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="label">Dorsal</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="field"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                  />
                </div>
                <div>
                  <span className="label">Edad</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="field"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blanco px-3 py-2.5">
                <span className="text-sm font-medium text-marino">Capitán</span>
                <Switch
                  checked={isCaptain}
                  onChange={setIsCaptain}
                  label="Capitán"
                />
              </div>

              <div>
                <span className="label">Posición</span>
                <input
                  className="field"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>

              <div className="space-y-3 rounded-xl bg-blanco px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-marino">
                    Varias posiciones
                  </span>
                  <Switch
                    checked={multi}
                    onChange={(v) => {
                      setMulti(v);
                      if (v && extraPositions.length === 0)
                        setExtraPositions([""]);
                    }}
                    label="Varias posiciones"
                  />
                </div>

                {multi && (
                  <div className="space-y-2">
                    {extraPositions.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className="field"
                          placeholder={`Posición adicional ${i + 1}`}
                          value={p}
                          onChange={(e) =>
                            setExtraPositions((prev) =>
                              prev.map((x, idx) =>
                                idx === i ? e.target.value : x,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExtraPositions((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="rounded-lg p-2 text-gris hover:text-marino"
                          aria-label="Quitar posición"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-ghost w-full"
                      onClick={() =>
                        setExtraPositions((prev) => [...prev, ""])
                      }
                    >
                      <Plus size={16} /> Añadir posición
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-dashed border-marino/20 bg-blanco/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gris">
                  Datos de acceso del jugador
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="label">Usuario</span>
                    <input
                      className="field"
                      autoCapitalize="none"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <span className="label">Contraseña</span>
                    <input
                      className="field"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={saving}
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {saving ? "Guardando…" : "Guardar ficha"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
