import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReelJolt — 5 pubs vidéo motion-design en 30 secondes",
  description:
    "Colle l'URL de ta boutique. ReelJolt extrait ta direction artistique et génère 5 pubs vidéo motion-design prêtes pour Meta, TikTok et YouTube.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-grain">{children}</body>
    </html>
  );
}
