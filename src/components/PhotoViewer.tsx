"use client";

import * as React from "react";
import { X } from "lucide-react";

// Visor de fotografías ampliadas: modal centrado en ordenador y casi a pantalla
// completa en móvil. Conserva la proporción y no amplía más allá del tamaño
// original para no degradar la imagen.
export function PhotoViewer({
  photo,
  name,
  onClose,
}: {
  photo: string;
  name: string;
  onClose: () => void;
}) {
  // Cierre con Escape y bloqueo temporal del desplazamiento de fondo.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotografía de ${name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-negro/90 p-4"
    >
      <div
        className="flex max-h-full w-full max-w-lg flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={`Fotografía de ${name}`}
          className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain"
        />
        <p className="mt-3 text-center text-sm font-medium text-beige">{name}</p>
        <button
          onClick={onClose}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blanco/15 px-4 py-2 text-sm font-semibold text-beige hover:bg-blanco/25"
        >
          <X size={16} /> Cerrar
        </button>
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-blanco/15 p-2 text-beige hover:bg-blanco/25"
      >
        <X size={18} />
      </button>
    </div>
  );
}
