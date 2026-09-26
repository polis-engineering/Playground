import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./tokens.css";
import "./globals.css";

/** Neutral grotesk fallback while the licensed NAP MD Grotesk file is not bundled. */
const fallbackGrotesk = Inter({ subsets: ["latin"], variable: "--font-fallback-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: "Polis, Works",
  description: "Polis, Works",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fallbackGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
