"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LS_KEY = "rhs:reviewer:unlocked:v1";

function safeGetUnlocked(): boolean {
  try {
    return window.localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

function safeSetUnlocked() {
  try {
    window.localStorage.setItem(LS_KEY, "1");
  } catch {
    // ignore
  }
}

export default function ReviewerGate(props: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const attemptedRef = useRef(false);

  const keyFromUrl = useMemo(() => {
    return (sp?.get("key") || "").trim();
  }, [sp]);

  const currentQuery = useMemo(() => sp?.toString() || "", [sp]);

  // Strip ?key= from URL (preserve everything else like d=...)
  function stripKeyFromUrl() {
    try {
      const params = new URLSearchParams(currentQuery);
      params.delete("key");
      const qs = params.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(next);
    } catch {
      // if anything goes sideways, do nothing
    }
  }

  useEffect(() => {
    // 1) If already unlocked locally, just allow.
    if (safeGetUnlocked()) {
      setUnlocked(true);
      setReady(true);

      // If someone navigated with ?key= anyway, clean it.
      if (keyFromUrl) stripKeyFromUrl();
      return;
    }

    // 2) If no key provided, stay locked.
    if (!keyFromUrl) {
      setUnlocked(false);
      setReady(true);
      return;
    }

    // 3) Verify key once (avoid double-fetch loops).
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/reviewer/verify?key=${encodeURIComponent(keyFromUrl)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.ok === true) {
            safeSetUnlocked();
            setUnlocked(true);
            setReady(true);

            // Remove the key from the URL immediately.
            stripKeyFromUrl();
            return;
          }
        }

        // invalid key
        setUnlocked(false);
        setReady(true);
      } catch {
        setUnlocked(false);
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyFromUrl, pathname, currentQuery]);

  if (!ready) return null;

  if (!unlocked) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Reviewer mode locked</h1>
        <p style={{ marginTop: 10, lineHeight: 1.6, opacity: 0.85 }}>
          Add <code>?key=YOUR_REVIEWER_KEY</code> to the URL to unlock.
        </p>
      </main>
    );
  }

  return <>{props.children}</>;
}
