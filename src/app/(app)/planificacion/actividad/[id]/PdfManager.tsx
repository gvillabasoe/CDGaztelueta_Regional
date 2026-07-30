"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Upload, Trash2, Loader2, Eye } from "lucide-react";
import { uploadActivityFile, deleteActivityFile } from "@/actions/activity";

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("read"));
    r.readAsDataURL(file);
  });
  return dataUrl.split(",")[1] ?? "";
}

export function PdfManager({
  activityId,
  isCoach,
  fileName,
}: {
  activityId: string;
  isCoach: boolean;
  fileName: string | null;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await uploadActivityFile(activityId, {
        name: file.name,
        mime: file.type || "application/pdf",
        dataBase64,
      });
      if (!res.ok) setError(res.error);
      else router.refresh();
    } catch {
      setError("No se pudo subir el archivo.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar el documento del entrenamiento?")) return;
    setBusy(true);
    await deleteActivityFile(activityId);
    setBusy(false);
    router.refresh();
  }

  const href = `/api/activity-file/${activityId}`;

  return (
    <div>
      {fileName ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-beige p-3">
          <FileText size={20} className="text-marino" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {fileName}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-marino px-2.5 py-1.5 text-xs font-semibold text-blanco"
          >
            <Eye size={13} /> Ver
          </a>
          <a
            href={`${href}?download=1`}
            className="inline-flex items-center gap-1 rounded-lg border border-gris/30 bg-blanco px-2.5 py-1.5 text-xs font-semibold text-marino"
          >
            <Download size={13} /> Descargar
          </a>
          {isCoach && (
            <>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg border border-gris/30 bg-blanco px-2.5 py-1.5 text-xs font-semibold text-marino"
              >
                <Upload size={13} /> Sustituir
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-blanco px-2.5 py-1.5 text-xs font-semibold text-red-600"
              >
                <Trash2 size={13} /> Eliminar
              </button>
            </>
          )}
        </div>
      ) : isCoach ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-ghost w-full"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          Subir PDF
        </button>
      ) : (
        <p className="rounded-xl bg-beige p-3 text-sm text-gris">
          Sin documento para este entrenamiento.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-amarillo/25 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={onFile}
        className="hidden"
      />
    </div>
  );
}
