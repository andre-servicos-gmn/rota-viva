import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Display com largura de placa de sinalização (eixo wdth do Archivo).
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--fonte-display",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fonte-sans",
  display: "swap",
});

// Mono não é decoração: é código IATA, localizador, horário e valor tabular.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fonte-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rota Viva — agência de viagens",
  description:
    "Prova de conceito: agente de viagens com chat, busca de voos, hotéis e roteiros.",
};

export const viewport: Viewport = {
  themeColor: "#0b1524",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[3px] focus:bg-pista focus:px-4 focus:py-2 focus:font-medium focus:text-noite"
        >
          Ir para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
