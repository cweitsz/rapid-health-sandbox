"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "rhs:privacyBannerDismissed:v1";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export default function PrivacyBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = safeGet(KEY);
    setShow(!dismissed);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        borderBottom: "1px solid #ddd",
        background: "rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "10px 16px",
          fontFamily: "system-ui",
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, lineHeight: 1.35, opacity: 0.9 }}>
          <strong>Privacy:</strong> This app stores data locally in your browser. Don’t enter identifiable patient data.{" "}
          <Link href="/privacy" style={{ textDecoration: "underline" }}>
            Learn more
          </Link>
          .
        </div>

        <button
          type="button"
          onClick={() => {
            safeSet(KEY, "1");
            setShow(false);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 10,
            fontWeight: 800,
            background: "transparent",
            cursor: "pointer",
            fontFamily: "system-ui",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
