"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isUuidLike } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";
import { getActiveDossierId, getDossier, listDossiers, setActiveDossierId } from "@/lib/storage";

function requiresDossier(pathname: string): boolean {
  return (
    pathname.startsWith("/steps/") ||
    pathname.startsWith("/sprints/") ||
    pathname === "/review" ||
    pathname.startsWith("/review/")
  );
}

function isDossierNeutral(pathname: string): boolean {
  // These pages must NEVER auto-redirect due to dossier state.
  return pathname === "/" || pathname === "/intake" || pathname === "/privacy";
}

// --- Safe wrappers (storage can throw) ---
function safeGetActive(): string | null {
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

function safeSetActive(id: string) {
  try {
    setActiveDossierId(id);
  } catch {
    // ignore
  }
}

export default function DossierGate(props: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);

  // Current URL (pathname + query), used when we need to add/overwrite ?d=
  const currentHref = useMemo(() => {
    const qs = searchParams?.toString() || "";
    return qs ? `${pathname}?${qs}` : `${pathname}`;
  }, [pathname, searchParams]);

  const dFromUrl = useMemo(() => {
    return (searchParams?.get("d") || "").trim();
  }, [searchParams]);

  useEffect(() => {
    if (!pathname) return;

    // ✅ Never gate the landing page or other neutral pages.
    if (isDossierNeutral(pathname)) {
      setReady(true);
      return;
    }

    // ✅ If this route doesn't require a dossier, allow it.
    if (!requiresDossier(pathname)) {
      setReady(true);
      return;
    }

    // From here: dossier-required routes only.

    // 1) If URL has a valid dossier and we can load it, accept and proceed.
    if (dFromUrl && isUuidLike(dFromUrl)) {
      const fromUrl = safeGetDossier(dFromUrl);
      if (fromUrl) {
        safeSetActive(dFromUrl);
        setReady(true);
        return;
      }
    }

    // 2) If there's an active dossier, redirect to the SAME page with ?d=<active>.
    const active = safeGetActive();
    if (active && isUuidLike(active)) {
      const d = safeGetDossier(active);
      if (d) {
        router.replace(withDossier(currentHref, active));
        return;
      }
    }

    // 3) If there are any dossiers, pick the first and redirect with ?d=...
    const list = safeListDossiers();
    const first = list[0]?.id || null;
    if (first && isUuidLike(first) && safeGetDossier(first)) {
      safeSetActive(first);
      router.replace(withDossier(currentHref, first));
      return;
    }

    // 4) No dossiers exist: go to intake.
    router.replace("/intake");
  }, [pathname, currentHref, dFromUrl, router]);

  // If it's a dossier-required route and we're not ready, don't flash the page.
  if (!ready && pathname && requiresDossier(pathname)) {
    return null;
  }

  return <>{props.children}</>;
}
