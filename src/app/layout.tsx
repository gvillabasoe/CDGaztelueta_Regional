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
};

export const viewport: Viewport = {
  themeColor: "#16233F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
