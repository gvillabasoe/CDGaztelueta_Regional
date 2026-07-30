import type { Config } from "tailwindcss";

/**
 * Paleta principal solicitada en el prompt:
 * Blanco, Beige, Dorado, Amarillo, Azul marino, Gris, Negro.
 * Se usa además el verde/rojo estándar de Tailwind únicamente para los
 * estados que el propio prompt describe con esos colores (asistencia
 * "SÍ/NO" y multas "Pagado/Pendiente"). Al usar theme.extend, la paleta
 * estándar de Tailwind sigue disponible junto a estos colores propios.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blanco: "#FFFFFF",
        beige: "#F1E9D8",
        dorado: "#C9A227",
        amarillo: "#F4C20D",
        marino: "#16233F",
        gris: "#7C818C",
        negro: "#1A1A1A",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(22,35,63,0.08), 0 1px 2px rgba(22,35,63,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
