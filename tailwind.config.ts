import type { Config } from "tailwindcss";

/**
 * Paleta de colores EXCLUSIVA solicitada en el prompt:
 * Blanco, Beige, Dorado, Amarillo, Azul marino, Gris, Negro.
 * No se usa ningún color fuera de esta lista.
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
