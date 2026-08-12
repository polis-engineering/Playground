import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DevToolsGate } from "@/components/dev/DevToolsGate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Polis Works — Shivam Bharadwaj",
  description:
    "Designer Engineer portfolio — Figma-to-code playground with correction workflow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        {children}
        <DevToolsGate />
      </body>
    </html>
  );
}
