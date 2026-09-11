import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";

const display = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CD Gaztelueta",
  description: "Seguimiento del equipo — CD Gaztelueta",
  // Manifest (Android/Chrome): iconos, nombre y arranque en modo aplicación.
  manifest: "/manifest.webmanifest",
  // iOS NO usa los iconos del manifest para la pantalla de inicio: necesita
  // apple-touch-icon. Ambos apuntan al escudo subido en Configuración.
  icons: {
    icon: [
      { url: "/api/app-icon/192", sizes: "192x192", type: "image/png" },
      { url: "/api/app-icon/512", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/api/app-icon/192" }],
    apple: [{ url: "/api/app-icon/180", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "CD Gaztelueta",
    statusBarStyle: "black-translucent",
  },
  applicationName: "CD Gaztelueta",
};

export const viewport: Viewport = {
  themeColor: "#16233F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Respeta la zona segura en iPhone cuando se abre como aplicación.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        {/* Marco tipo móvil, centrado en pantallas grandes */}
        <div className="mx-auto flex min-h-screen w-full max-w-[760px] flex-col bg-beige">
          {children}
        </div>
      </body>
    </html>
  );
}
