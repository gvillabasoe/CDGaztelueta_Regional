"use client";

import * as React from "react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PhotoViewer } from "@/components/PhotoViewer";

// Avatar pulsable: al pulsarlo se ve la foto AMPLIADA (nunca abre el selector
// de archivos; editar la foto es una acción distinta desde "Editar perfil").
export function Avatar({
  photo,
  name,
  size = 40,
}: {
  photo: string | null;
  name: string;
  size?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");

  if (!photo) {
    return (
      <PlayerAvatar photo={null} firstName={first} lastName={last} size={size} />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver la fotografía de ${name} ampliada`}
        title="Ver foto ampliada"
        className="shrink-0 rounded-full"
      >
        <PlayerAvatar
          photo={photo}
          firstName={first}
          lastName={last}
          size={size}
        />
      </button>
      {open && (
        <PhotoViewer
          photo={photo}
          name={name}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
