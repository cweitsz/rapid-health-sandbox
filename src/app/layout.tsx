import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DossierGate from "@/components/DossierGate";
import PrivacyBanner from "@/components/PrivacyBanner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rapid Health Sandbox",
  description: "Lean validation dossiers with local autosave",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PrivacyBanner />
        <Suspense fallback={null}>
          <DossierGate>{children}</DossierGate>
        </Suspense>
        <SpeedInsights />
      </body>
    </html>
  );
}
