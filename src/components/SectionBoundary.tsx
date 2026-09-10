"use client";

import * as React from "react";

// Barrera de error POR SECCIÓN: si un bloque concreto falla (asistencia,
// documento, ejercicios…), solo se cae ese bloque y el resto de la pantalla
// sigue funcionando. Evita que un fallo local derribe toda la ruta.
type Props = { name: string; children: React.ReactNode };
type State = { failed: boolean };

export class SectionBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Información técnica para diagnóstico (no se muestra al usuario).
    console.error(`Fallo en la sección "${this.props.name}":`, error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="rounded-xl border border-gris/25 bg-beige/60 p-4 text-sm text-negro">
          <p className="font-medium">
            No se ha podido cargar esta sección ({this.props.name}).
          </p>
          <p className="mt-1 text-xs text-gris">
            El resto de la actividad sí está disponible. Vuelve a intentarlo más
            tarde.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
