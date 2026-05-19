import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoomUNAP — Habitaciones para estudiantes UNAP",
  description:
    "La plataforma de alojamiento exclusiva para la comunidad de la Universidad Nacional del Altiplano. Encuentra tu habitación cerca del campus en Puno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-[101vh] flex flex-col">{children}</body>
    </html>
  );
}