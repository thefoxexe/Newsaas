import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./i18n/language-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReelJolt — 5 motion-design video ads in 30 seconds",
  description:
    "Paste your store's URL. ReelJolt extracts your real brand identity and generates 5 motion-design video ads ready for Meta, TikTok, and YouTube.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-grain">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
