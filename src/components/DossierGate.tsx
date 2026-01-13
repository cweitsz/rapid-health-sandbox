// src/components/DossierGate.tsx
"use client";

// Canonical dossier rule:
// - /steps/*, /sprints/*, /review*: URL (?d=) is the source of truth. No storage fallback.
// - /intake: dossier-neutral (strip ?d=).
// - /: cold start allowed to use storage to resume last visited step.

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getActiveDossierId, getDossier, listDossiers, setActiveDossierId } from "@/lib/storage";
import { isUuidLike } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";

type Props = {
  children: ReactNode;
};

function safeGetActiveDossierId(): string | null {
  try {
    return getActiveDossierId();
  } catch {
    return null;
  }
}
function safeGetDossier(id: string) {
  try {
    return getDossier(id);
  } catch {
    return null;
  }
}
function safeListDossiers() {
  try {
    return listDossiers();
  } catch {
    return [];
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

export default function DossierGate({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Next's searchParams object is not stable; stringify for effect deps.
  const spKey = sp.toString();

  // Avoid flashing children before we decide whether to redirect.
  const [ready, setReady] = useState(false);

  // Derive params once per spKey
  const params = useMemo(() => new URLSearchParams(spKey), [spKey]);

  useEffect(() => {
    setReady(false);

    // --- Intake is dossier-neutral: never keep ?d= in the URL ---
    if (pathname === "/intake") {
      if (params.has("d")) {
        params.delete("d");
        const nextQs = params.toString();
        const next = nextQs ? `/intake?${nextQs}` : "/intake";
        const current = spKey ? `/intake?${spKey}` : "/intake";
        if (next !== current) {
          router.replace(next);
          return;
        }
      }
      setReady(true);
      return;
    }

    // --- Cold start (home): storage fallback is allowed here ONLY ---
    if (pathname === "/") {
      const dParam = params.get("d")?.trim();
      const dUrl = dParam && isUuidLike(dParam) ? dParam : null;

      // If URL has a valid dossier, prefer it.
      const fromUrl = dUrl ? safeGetDossier(dUrl) : null;
      if (dUrl && fromUrl) {
        safeSetActiveDossierId(dUrl);
        const step = (fromUrl as any).lastVisitedStepId || "1-1";
        router.replace(withDossier(`/steps/${step}`, dUrl));
        return;
      }

      // Otherwise fall back to storage active, then first dossier.
      const storageActive = safeGetActiveDossierId();
      const storageValid = storageActive && isUuidLike(storageActive) ? storageActive : null;

      let active = storageValid;
      let dossier = active ? safeGetDossier(active) : null;

      if (!dossier) {
        const list = safeListDossiers();
        active = list[0]?.id ?? null;
        dossier = active ? safeGetDossier(active) : null;
      }

      if (!active || !dossier) {
        router.replace("/intake");
        return;
      }

      safeSetActiveDossierId(active);
      const step = (dossier as any).lastVisitedStepId || "1-1";
      router.replace(withDossier(`/steps/${step}`, active));
      return;
    }

    // --- Dossier-bound routes: URL is canonical. NO storage fallback. ---
    if (!isDossierBoundRoute(pathname)) {
      setReady(true);
      return;
    }

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

    // One-way sync: URL -> storage (so Intake can show the same active dossier)
    safeSetActiveDossierId(d);
    setReady(true);
  }, [router, pathname, spKey]); // params derived from spKey

  if (!ready) return null;
  return <>{children}</>;
}
