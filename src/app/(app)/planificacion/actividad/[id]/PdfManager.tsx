"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Upload, Trash2, Loader2, Eye } from "lucide-react";
import { uploadActivityFile, deleteActivityFile } from "@/actions/activity";
import { markActivityFileViewed } from "@/actions/activity";

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
  pdfPending = false,
  fileName,
}: {
  activityId: string;
  isCoach: boolean;
  pdfPending?: boolean;
  fileName: string | null;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [opening, setOpening] = React.useState(false);
  const [openErr, setOpenErr] = React.useState<string | null>(null);
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

  // Abre el PDF y lo marca como consultado SOLO si la apertura se completa.
  // Un fallo o un archivo inexistente no marca nada como visto.
  async function openPdf() {
    setOpening(true);
    setOpenErr(null);
    try {
      const res = await fetch(href, { method: "GET" });
      if (!res.ok) {
        setOpenErr("No se ha podido abrir el documento. Inténtalo de nuevo.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      await markActivityFileViewed(activityId);
      router.refresh();
    } catch (err) {
      console.error("abrir PDF", err);
      setOpenErr("No se ha podido abrir el documento. Inténtalo de nuevo.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div>
      {fileName ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-beige p-3">
          <FileText size={20} className="text-marino" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {fileName}
            {pdfPending && (
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 align-middle text-[10px] font-bold text-red-700">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-red-600"
                />
                NUEVO
              </span>
            )}
          </span>
          <button
            onClick={openPdf}
            disabled={opening}
            className="inline-flex items-center gap-1 rounded-lg bg-marino px-2.5 py-1.5 text-xs font-semibold text-blanco disabled:opacity-50"
          >
            {opening ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Eye size={13} />
            )}
            VER PDF
          </button>
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
      {openErr && (
        <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
          {openErr}
        </p>
      )}
    </div>
  );
}
