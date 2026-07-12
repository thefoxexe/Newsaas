import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelJolt — Pubs vidéo motion-design en 30 secondes",
  description:
    "Colle l'URL de ta boutique. ReelJolt extrait ta direction artistique et génère 5 pubs vidéo motion-design prêtes pour Meta, TikTok et YouTube.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
