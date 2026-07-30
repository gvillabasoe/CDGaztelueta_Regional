"use client";

import * as React from "react";
import { Users } from "lucide-react";

// Muestra la fotografía real de la plantilla si el entrenador la ha subido.
// Si todavía no existe, deja preparado un espacio con un aviso (sin inventar jugadores).
export function TeamPhoto({
  className = "",
  rounded = "rounded-2xl",
}: {
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div
        className={
          "flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-beige/30 bg-marino/40 text-center text-beige/70 " +
          rounded +
          " " +
          className
        }
      >
        <Users size={30} />
        <p className="px-4 text-xs">
          Fotografía de la plantilla pendiente de añadir
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/api/team-image/photo"
      alt="Plantilla del CD Gaztelueta"
      onError={() => setFailed(true)}
      className={"aspect-[16/9] w-full object-cover " + rounded + " " + className}
    />
  );
}
