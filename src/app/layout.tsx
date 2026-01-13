import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DossierGate from "@/components/DossierGate";
import PrivacyBanner from "@/components/PrivacyBanner";

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
          <DossierGate />

          <div
            style={{
              maxWidth: 980,
              margin: "0 auto",
              padding: 24,
              fontFamily: "system-ui",
            }}
          >
            {children}
          </div>
        </Suspense>
      </body>
    </html>
  );
}
