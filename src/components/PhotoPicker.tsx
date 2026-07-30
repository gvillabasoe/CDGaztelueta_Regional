"use client";

import * as React from "react";
import { Camera, X } from "lucide-react";

// Avatar con icono de cámara para añadir/cambiar la foto (patrón tipo WhatsApp,
// sin copiar elementos protegidos). Devuelve la imagen como data URL redimensionada.
async function resizeToDataUrl(file: File, max = 256): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
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
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function PhotoPicker({
  value,
  onChange,
  size = 96,
  round = true,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  size?: number;
  round?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const shape = round ? "rounded-full" : "rounded-2xl";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await resizeToDataUrl(file, round ? 256 : 900));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={
            "flex h-full w-full items-center justify-center overflow-hidden border-2 border-dashed border-gris/40 bg-beige " +
            shape
          }
          style={{ width: size, height: size }}
          aria-label="Añadir fotografía"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Foto"
              className={"h-full w-full object-cover " + shape}
            />
          ) : (
            <Camera className="text-gris" size={size * 0.3} />
          )}
        </button>
        <span
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-dorado text-marino shadow"
        >
          <Camera size={16} />
        </span>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 text-xs font-medium text-gris hover:text-negro"
        >
          <X size={13} /> Quitar foto
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      {busy && <span className="text-xs text-gris">Procesando…</span>}
    </div>
  );
}
