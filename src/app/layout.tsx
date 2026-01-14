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

// TODO later: set this to your custom domain when you have one.
// Using vercel.app here is fine for now.
const SITE_URL = "https://rapid-health-sandbox.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rapid Health Sandbox",
    template: "%s · Rapid Health Sandbox",
  },
  description:
    "A practical validation sprint for early-stage health ideas. Artifacts-first, decision discipline, local-first drafts.",
  applicationName: "Rapid Health Sandbox",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Rapid Health Sandbox",
    description:
      "A practical validation sprint for early-stage health ideas. Evidence-grade decisions, local-first drafts.",
    siteName: "Rapid Health Sandbox",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rapid Health Sandbox",
    description:
      "A practical validation sprint for early-stage health ideas. Evidence-grade decisions, local-first drafts.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
