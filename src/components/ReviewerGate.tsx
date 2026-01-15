"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STORAGE_KEY = "rhs:reviewerUnlocked:v1";

type Status = "checking" | "locked" | "unlocked";

export default function ReviewerGate(props: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("checking");
  const [inputKey, setInputKey] = useState("");
  const [msg, setMsg] = useState<string>("");

  const urlKey = useMemo(() => (searchParams?.get("key") ?? "").trim(), [searchParams]);

  function stripKeyFromUrl() {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("key");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`);
  }

  async function verifyKey(key: string): Promise<boolean> {
    const k = (key ?? "").trim();
    if (!k) return false;

    try {
      const res = await fetch(`/api/reviewer/verify?key=${encodeURIComponent(k)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) return false;

      const json = (await res.json()) as any;
      return !!json?.ok;
    } catch {
      return false;
    }
  }

  function safeGetUnlocked(): boolean {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function safeSetUnlocked() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  function safeClearUnlocked() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // Already unlocked on this device
    if (safeGetUnlocked()) {
      setStatus("unlocked");
      return;
    }

    // URL has key: verify it
    if (urlKey) {
      (async () => {
        const ok = await verifyKey(urlKey);
        if (ok) {
          safeSetUnlocked();
          setStatus("unlocked");
          stripKeyFromUrl(); // IMPORTANT: removes key but preserves ?d=
          return;
        }

        setMsg("Invalid reviewer key.");
        setStatus("locked");
      })();

      return;
    }

    setStatus("locked");
  }, [urlKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onUnlock() {
    setMsg("");
    const ok = await verifyKey(inputKey);
    if (!ok) {
      setMsg("Invalid reviewer key.");
      return;
    }

    safeSetUnlocked();
    setStatus("unlocked");
    stripKeyFromUrl();
  }

  if (status === "unlocked") return <>{props.children}</>;
  if (status === "checking") return null;

  // Locked UI
  return (
    <main style={wrap}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Reviewer access</h1>
      <p style={{ marginTop: 10, lineHeight: 1.6, maxWidth: 760, opacity: 0.9 }}>
        This page is restricted. Enter a reviewer key to continue.
      </p>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="Reviewer key"
          style={input}
        />
        <button type="button" onClick={onUnlock} style={btn} disabled={!inputKey.trim()}>
          Unlock
        </button>

        <button
          type="button"
          onClick={() => {
            safeClearUnlocked();
            setInputKey("");
            setMsg("Cleared local unlock.");
          }}
          style={btnGhost}
        >
          Clear unlock
        </button>
      </div>

      {msg ? <div style={{ marginTop: 10, fontSize: 13, color: "#b00", fontWeight: 800 }}>{msg}</div> : null}

      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/" style={linkBtn}>
          ← Back to Home
        </Link>
        <Link href="/intake" style={linkBtn}>
          Go to Intake
        </Link>
      </div>

      <p style={{ marginTop: 14, fontSize: 12, opacity: 0.75, lineHeight: 1.5, maxWidth: 760 }}>
        Note: unlocking is stored only in your browser (localStorage). Clearing site data will remove access.
      </p>
    </main>
  );
}

const wrap: React.CSSProperties = {
  padding: 24,
  fontFamily: "system-ui",
  maxWidth: 980,
  margin: "0 auto",
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ccc",
  minWidth: 260,
  fontFamily: "system-ui",
};

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "transparent",
  fontWeight: 800,
  cursor: "pointer",
};

const linkBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontWeight: 800,
  textDecoration: "none",
};
