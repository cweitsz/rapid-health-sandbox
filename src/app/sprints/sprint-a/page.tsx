"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { isUuidLike } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";

export default function SprintA() {
  const sp = useSearchParams();
  const spKey = sp.toString();

  const dossierId = useMemo(() => {
    const params = new URLSearchParams(spKey);
    const d = params.get("d")?.trim();
    return d && isUuidLike(d) ? d : null;
  }, [spKey]);

  const homeHref = useMemo(() => {
    if (!dossierId) return "/";
    return withDossier("/", dossierId);
  }, [dossierId]);

  const reviewHref = useMemo(() => {
    if (!dossierId) return "/intake";
    return withDossier("/review", dossierId);
  }, [dossierId]);

  const stepHref = useMemo(() => {
    return (stepId: string) => {
      if (!dossierId) return "/intake";
      return withDossier(`/steps/${stepId}`, dossierId);
    };
  }, [dossierId]);

  return (
    <main style={page}>
      <div style={topNav}>
        <Link href={homeHref} style={linkBtnStyle}>
          Home
        </Link>
        <Link href={reviewHref} style={linkBtnStyle}>
          Overall Review
        </Link>
        <Link href="/intake" style={linkBtnStyle}>
          Intake
        </Link>
      </div>

      <h1 style={h1}>Sprint A: Define &amp; Map</h1>

      <p style={lead}>
        Goal: lock in a single, testable problem definition and stakeholder reality.
      </p>

      {!dossierId ? (
        <div style={warnBox}>
          <strong>No dossier selected.</strong> Go to{" "}
          <Link href="/intake" style={inlineLink}>
            /intake
          </Link>{" "}
          to create or select one.
        </div>
      ) : (
        <div style={meta}>
          Active dossier: <code>{dossierId}</code>
        </div>
      )}

      <section style={card}>
        <h2 style={h2}>Steps</h2>
        <div style={stepList}>
          <Link href={stepHref("1-1")} style={stepBtnStyle}>
            1.1 Problem Definition →
          </Link>
          <Link href={stepHref("1-2")} style={stepBtnStyle}>
            1.2 Stakeholder &amp; Owner/Payer Map →
          </Link>
          <Link href={stepHref("1-3")} style={stepBtnStyle}>
            1.3 Workarounds &amp; Status Quo →
          </Link>
        </div>
      </section>

      <div style={{ marginTop: 18 }}>
        <Link href={homeHref} style={linkBtnStyle}>
          ← Back home
        </Link>
      </div>
    </main>
  );
}

const page: CSSProperties = {
  padding: 24,
  fontFamily: "system-ui",
  maxWidth: 980,
  margin: "0 auto",
};

const topNav: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 14,
};

const h1: CSSProperties = { fontSize: 28, fontWeight: 900, margin: 0 };
const lead: CSSProperties = { marginTop: 10, maxWidth: 760, lineHeight: 1.6, opacity: 0.9 };

const meta: CSSProperties = { marginTop: 12, fontSize: 12, opacity: 0.75 };

const warnBox: CSSProperties = {
  marginTop: 14,
  padding: 12,
  border: "1px solid #ccc",
  borderRadius: 12,
  maxWidth: 760,
};

const card: CSSProperties = {
  marginTop: 18,
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 16,
};

const h2: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 900 };

const stepList: CSSProperties = {
  marginTop: 12,
  display: "grid",
  gap: 10,
  maxWidth: 760,
};

const linkBtnStyle: CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  textDecoration: "none",
};

const stepBtnStyle: CSSProperties = {
  display: "block",
  padding: "12px 14px",
  border: "1px solid #ddd",
  borderRadius: 12,
  fontWeight: 800,
  textDecoration: "none",
};

const inlineLink: CSSProperties = { fontWeight: 800, textDecoration: "none" };
