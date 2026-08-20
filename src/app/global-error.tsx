"use client";

import * as React from "react";

// Último recurso: si falla el propio layout raíz, se muestra una pantalla
// controlada en lugar del error genérico del navegador.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Error global:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#16233F",
          color: "#F1E9D8",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>CD Gaztelueta</h1>
          <p style={{ marginTop: "12px", fontSize: "14px", opacity: 0.9 }}>
            No se ha podido cargar la aplicación. Inténtalo de nuevo.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "20px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "#C9A227",
              color: "#1A1A1A",
              fontWeight: 600,
            }}
          >
            Volver a intentarlo
          </button>
        </div>
      </body>
    </html>
  );
}
