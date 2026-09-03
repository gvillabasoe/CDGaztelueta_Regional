"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Camera } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { updateMyProfile } from "@/actions/profile";

// Redimensiona conservando la PROPORCIÓN. 512 px de lado mayor: suficiente
// para el visor ampliado sin generar imágenes enormes.
async function resizePhoto(file: File, max = 512): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("lectura"));
    r.readAsDataURL(file);
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
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function EditProfileForm({
  initialNickname,
  initialPhoto,
  realName,
}: {
  initialNickname: string;
  initialPhoto: string | null;
  realName: string;
}) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = React.useState(initialNickname);
  const [photo, setPhoto] = React.useState<string | null>(initialPhoto);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setError(null);
    try {
      setPhoto(await resizePhoto(file));
    } catch (err) {
      console.error(err);
      setError("No se ha podido procesar la imagen. Prueba con otra.");
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await updateMyProfile({ nickname, photo });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOk("Perfil actualizado correctamente.");
      router.refresh();
    } catch (err) {
      console.error("guardar perfil", err);
      setError("No se han podido guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const parts = realName.trim().split(/\s+/);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="eyebrow mb-3">Fotografía</p>
        <div className="flex items-center gap-4">
          <PlayerAvatar
            photo={photo}
            firstName={parts[0] ?? ""}
            lastName={parts.slice(1).join(" ")}
            size={72}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gris/30 px-3 py-2 text-xs font-semibold text-marino"
            >
              <Camera size={14} />
              {photo ? "Cambiar fotografía" : "Subir fotografía"}
            </button>
            {photo && (
              <button
                onClick={() => setPhoto(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
              >
                <Trash2 size={14} /> Quitar fotografía
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-gris">
          Si quitas la fotografía se mostrará el avatar con tus iniciales.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={pick}
          className="hidden"
        />
      </div>

      <div className="card p-5">
        <label className="label" htmlFor="mote">
          Mote
        </label>
        <input
          id="mote"
          className="field"
          placeholder="Como te llaman en el equipo"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={24}
        />
        <p className="mt-2 text-xs text-gris">
          El mote se usa como nombre principal en las clasificaciones y las
          votaciones. Tu nombre y apellidos ({realName}) se conservan en tu
          ficha y no se modifican.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
          {ok}
        </p>
      )}

      <button className="btn-primary w-full" onClick={save} disabled={busy}>
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Guardar cambios
      </button>
    </div>
  );
}
