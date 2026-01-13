// src/components/DossierGate.tsx
"use client";

// Canonical dossier rule:
// - /steps/*, /sprints/*, /review*: URL (?d=) is the source of truth. No storage fallback.
// - /intake: dossier-neutral (strip ?d=).
// - /: landing page (no redirects, no storage resume)

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDossier, setActiveDossierId } from "@/lib/storage";
import { isUuidLike } from "@/lib/dossier";

function safeGetDossier(id: string) {
  try {
    return getDossier(id);
  } catch {
    return null;
  }
}

function safeSetActiveDossierId(id: string) {
  try {
    setActiveDossierId(id);
  } catch {
    // storage unavailable/blocked
  }
}

function isDossierBoundRoute(pathname: string) {
  return (
    pathname.startsWith("/steps/") ||
    pathname.startsWith("/sprints/") ||
    pathname === "/review" ||
    pathname.startsWith("/review/")
  );
}

export default function DossierGate() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const spKey = sp.toString(); // stable dependency

  useEffect(() => {
    const params = new URLSearchParams(spKey);

    // --- Landing page: never redirect ---
    if (pathname === "/") return;

    // --- Intake is dossier-neutral: never keep ?d= in the URL ---
    if (pathname === "/intake") {
      if (params.has("d")) {
        params.delete("d");
        const nextQs = params.toString();
        const next = nextQs ? `/intake?${nextQs}` : "/intake";
        const current = spKey ? `/intake?${spKey}` : "/intake";
        if (next !== current) router.replace(next);
      }
      return;
    }

    // --- Dossier-bound routes: URL is canonical. NO storage fallback. ---
    if (!isDossierBoundRoute(pathname)) return;

    const dParam = params.get("d")?.trim();
    const d = dParam && isUuidLike(dParam) ? dParam : null;

    if (!d) {
      router.replace("/intake");
      return;
    }

    const dossier = safeGetDossier(d);
    if (!dossier) {
      router.replace("/intake");
      return;
    }

    // One-way sync: URL -> storage (so Intake can highlight the same active dossier)
    safeSetActiveDossierId(d);
  }, [router, pathname, spKey]);

  return null;
}
