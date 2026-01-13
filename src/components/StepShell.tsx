// src/components/StepShell.tsx
"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { withDossier } from "@/lib/dossierHref";

type Props = {
  stepId: string;           // "1-1" ... "1-10"
  title: string;
  subtitle?: string;
  dossierId: string;
  dossierName?: string;
  saveMsg?: string;
  children: ReactNode;

  // Optional overrides if you ever need them later
  prevHrefOverride?: string;
  nextHrefOverride?: string;
};

const ORDER = ["1-1","1-2","1-3","1-4","1-5","1-6","1-7","1-8","1-9","1-10"];

function isDossierBoundPath(path: string) {
  return (
    path.startsWith("/steps/") ||
    path.startsWith("/sprints/") ||
    path === "/review" ||
    path.startsWith("/review/")
  );
}

function normalizeHref(href: string, dossierId: string) {
  // If someone passes an internal href override but forgets ?d=,
  // we patch it automatically for dossier-bound routes.
  if (!href) return href;
  if (!dossierId) return href;
  if (!href.startsWith("/")) return href; // external or weird
  if (!isDossierBoundPath(href)) return href;
  return withDossier(href, dossierId);
}

export default function StepShell(props: Props) {
  const idx = ORDER.indexOf(props.stepId);
  const prevId = idx > 0 ? ORDER[idx - 1] : null;
  const nextId = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;

  const intakeHref = "/intake";
  const reviewHref = props.dossierId ? withDossier("/review", props.dossierId) : "/intake";

  const prevHref = props.prevHrefOverride
    ? normalizeHref(props.prevHrefOverride, props.dossierId)
    : prevId
    ? withDossier(`/steps/${prevId}`, props.dossierId)
    : "/intake";

  const nextHref = props.nextHrefOverride
    ? normalizeHref(props.nextHrefOverride, props.dossierId)
    : nextId
    ? withDossier(`/steps/${nextId}`, props.dossierId)
    : reviewHref;

  return (
    <main style={page}>
      {/* Top bar */}
      <div style={topBar}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={intakeHref} style={navBtn}>
            Back to Intake
          </Link>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={reviewHref} style={navBtn}>
            Overall Review
          </Link>
        </div>
      </div>

      {/* Title */}
      <header style={{ marginTop: 14 }}>
        <div style={{ opacity: 0.75, fontSize: 12 }}>
          {props.dossierName ? (
            <>
              <strong>{props.dossierName}</strong> · <span>Step {props.stepId}</span>
            </>
          ) : (
            <span>Step {props.stepId}</span>
          )}
          {props.saveMsg ? <span> · {props.saveMsg}</span> : null}
        </div>

        <h1 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 900 }}>{props.title}</h1>
        {props.subtitle ? (
          <p style={{ marginTop: 8, fontSize: 16, opacity: 0.85, lineHeight: 1.6 }}>
            {props.subtitle}
          </p>
        ) : null}
      </header>

      {/* Content */}
      <div style={{ marginTop: 14 }}>{props.children}</div>

      {/* Footer nav */}
      <footer style={footer}>
        <Link href={prevHref} style={linkBtn}>
          ← Prev
        </Link>

        <Link href={nextHref} style={linkBtn}>
          Next →
        </Link>
      </footer>
    </main>
  );
}

const page: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: 24,
  fontFamily: "system-ui",
};

const topBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const navBtn: CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ccc",
  fontWeight: 800,
  textDecoration: "none",
};

const footer: CSSProperties = {
  marginTop: 22,
  paddingTop: 14,
  borderTop: "1px solid #ddd",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const linkBtn: CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ccc",
  fontWeight: 800,
  textDecoration: "none",
};
