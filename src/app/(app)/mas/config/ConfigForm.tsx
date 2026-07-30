"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ImageOff } from "lucide-react";
import { updateTeamProfile, setTeamImage } from "@/actions/team";

async function resizeToDataUrl(file: File, max: number): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("read"));
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
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function ImageField({
  kind,
  label,
  max,
}: {
  kind: "crest" | "photo";
  label: string;
  max: number;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [bust, setBust] = React.useState(Date.now());
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setBusy(true);
    const dataUrl = await resizeToDataUrl(file, max);
    const m = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (m) {
      await setTeamImage(kind, { mime: m[1], dataBase64: m[2] });
      setBust(Date.now());
      setFailed(false);
      router.refresh();
    }
    setBusy(false);
  }

  const src = `/api/team-image/${kind}?t=${bust}`;

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        {kind === "crest" ? (
          <div className="rounded-xl bg-marino p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Escudo"
              className="h-14 w-14 rounded-lg object-cover"
            />
          </div>
        ) : failed ? (
          <div className="flex h-16 w-28 items-center justify-center rounded-xl bg-beige text-gris">
            <ImageOff size={20} />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Fotografía de la plantilla"
            onError={() => setFailed(true)}
            className="h-16 w-28 rounded-xl object-cover"
          />
        )}
        <button
          className="btn-ghost"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          Cambiar
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
    </div>
  );
}

export function ConfigForm({
  initialName,
  initialInfo,
}: {
  initialName: string;
  initialInfo: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [info, setInfo] = React.useState(initialInfo);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await updateTeamProfile({
      name,
      info: info.trim() || null,
    });
    setBusy(false);
    setMsg(res.ok ? "Información guardada." : res.error);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5">
        <p className="eyebrow">Identidad del equipo</p>
        <ImageField kind="crest" label="Escudo" max={512} />
        <ImageField kind="photo" label="Fotografía de la plantilla" max={1400} />
      </div>

      <div className="card space-y-3 p-5">
        <p className="eyebrow">Información general</p>
        <div>
          <label className="label">Nombre del equipo</label>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Información</label>
          <textarea
            className="field"
            rows={4}
            value={info}
            onChange={(e) => setInfo(e.target.value)}
          />
        </div>
        {msg && <p className="rounded-lg bg-beige px-3 py-2 text-sm">{msg}</p>}
        <button className="btn-primary w-full" onClick={save} disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />} Guardar
          información
        </button>
      </div>
    </div>
  );
}
