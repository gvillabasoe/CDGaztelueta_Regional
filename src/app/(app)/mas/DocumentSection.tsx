"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Eye,
  Download,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";
import { uploadTeamDocument, deleteTeamDocument } from "@/actions/docs";
import type { DocKind } from "@/lib/types";

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("read"));
    r.readAsDataURL(file);
  });
  return dataUrl.split(",")[1] ?? "";
}

// Componente común a Régimen Interno y Grupos de Material: la única diferencia
// es la categoría (kind), de forma que nunca se mezclan los documentos.
export function DocumentSection({
  kind,
  isCoach,
  fileName,
  updatedAtLabel,
}: {
  kind: DocKind;
  isCoach: boolean;
  fileName: string | null;
  updatedAtLabel: string | null;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await uploadTeamDocument(kind, {
        name: file.name,
        mime: file.type || "",
        dataBase64,
      });
      if (!res.ok) setError(res.error);
      else {
        setOk("Documento actualizado correctamente.");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("No se ha podido subir el documento. Inténtalo de nuevo.");
    } finally {
      // El estado de carga termina tanto en éxito como en error.
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar el documento vigente de este apartado?")) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await deleteTeamDocument(kind);
      if (!res.ok) setError(res.error);
      else router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se ha podido eliminar el documento. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const href = `/api/team-doc/${kind}`;

  return (
    <div className="space-y-3">
      {fileName ? (
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <FileText size={22} className="mt-0.5 shrink-0 text-marino" />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-negro">
                {fileName}
              </p>
              {updatedAtLabel && (
                <p className="mt-0.5 text-xs text-gris">
                  Última actualización: {updatedAtLabel}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-marino px-3 py-2 text-xs font-semibold text-blanco"
            >
              <Eye size={14} /> VER PDF
            </a>
            <a
              href={`${href}?download=1`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gris/30 px-3 py-2 text-xs font-semibold text-marino"
            >
              <Download size={14} /> DESCARGAR PDF
            </a>
            {isCoach && (
              <>
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gris/30 px-3 py-2 text-xs font-semibold text-marino disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Sustituir
                </button>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center">
          <FileText size={28} className="mx-auto mb-2 text-gris" />
          <p className="text-sm text-gris">
            Todavía no hay ningún documento publicado en este apartado.
          </p>
          {isCoach && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="btn-gold mt-3 w-full"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Subir PDF
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-amarillo/25 px-3 py-2 text-sm text-negro">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
          {ok}
        </p>
      )}

      {isCoach && (
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onFile}
          className="hidden"
        />
      )}
    </div>
  );
}
