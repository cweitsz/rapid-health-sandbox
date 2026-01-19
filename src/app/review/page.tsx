// src/app/review/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dossier } from "@/lib/dossier";
import { isUuidLike } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";
import { getDossier, exportDossier, downloadTextFile, upsertDossier } from "@/lib/storage";

type StepInfo = {
  id: string; // "1-1" ... "1-10"
  title: string;
  sprint: "A" | "B" | "C";
};

const STEPS: StepInfo[] = [
  { id: "1-1", title: "1.1 Problem Definition", sprint: "A" },
  { id: "1-2", title: "1.2 Stakeholder & Owner/Payer Map", sprint: "A" },
  { id: "1-3", title: "1.3 Workarounds & Status Quo", sprint: "A" },

  { id: "1-4", title: "1.4 Measurable Indicators", sprint: "B" },
  { id: "1-5", title: "1.5 Disconfirming Hypotheses", sprint: "B" },
  { id: "1-6", title: "1.6 Problem Validation Interviews/Observation", sprint: "B" },

  { id: "1-7", title: "1.7 Before/After & Solution Hypothesis", sprint: "C" },
  { id: "1-8", title: "1.8 Alternatives Scan", sprint: "C" },
  { id: "1-9", title: "1.9 Value Hook", sprint: "C" },
  { id: "1-10", title: "1.10 Gate Review", sprint: "C" },
];

type RubricKey = "problem" | "stakeholders" | "metrics" | "evidence" | "decision";

const RUBRIC: Array<{
  key: RubricKey;
  label: string;
  hint: string;
}> = [
  {
    key: "problem",
    label: "Problem is specific and testable (user + job + pain + impact)",
    hint: "Not a solution. Not vague. One user, one job, one measurable impact.",
  },
  {
    key: "stakeholders",
    label: "Stakeholder map matches reality (users, buyer, approver, payer)",
    hint: "Clear owner/payer and why they care.",
  },
  {
    key: "metrics",
    label: "Lead metrics + baselines are measurable next week",
    hint: "At least 2 lead metrics + how/when measured + guardrails if relevant.",
  },
  {
    key: "evidence",
    label: "Validation evidence is credible (not just opinions)",
    hint: "Observations/quotes/counts. Enough participants to justify a direction.",
  },
  {
    key: "decision",
    label: "Decision discipline (Go / One-iteration / Stop) is justified",
    hint: "The decision follows the evidence, not optimism.",
  },
];

type ReviewerV1 = {
  version: "reviewer-v1";
  updatedAt: string;
  scores: Record<RubricKey, number>; // 0-2 each
  notes: Record<RubricKey, string>;
  overallNotes: string;
};

/* ---------- helpers ---------- */

function safeGetDossier(id: string): Dossier | null {
  try {
    return getDossier(id);
  } catch {
    return null;
  }
}

function safeUpsertDossier(d: Dossier) {
  try {
    upsertDossier(d);
  } catch {
    // ignore
  }
}

function nowIso() {
  return new Date().toISOString();
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function defaultReviewer(): ReviewerV1 {
  return {
    version: "reviewer-v1",
    updatedAt: nowIso(),
    scores: {
      problem: 0,
      stakeholders: 0,
      metrics: 0,
      evidence: 0,
      decision: 0,
    },
    notes: {
      problem: "",
      stakeholders: "",
      metrics: "",
      evidence: "",
      decision: "",
    },
    overallNotes: "",
  };
}

function clampScore(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(2, n));
}

function getStepUpdatedAt(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const ts = obj.updatedAt;
  return typeof ts === "string" && ts.trim() ? ts : null;
}

function isMeaningfulGeneric(raw: unknown): boolean {
  if (raw == null) return false;

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, any>;

    // unwrap wrapped payloads: { value, updatedAt }
    if ("value" in obj && "updatedAt" in obj) {
      return isMeaningfulGeneric(obj.value);
    }

    if (Array.isArray(raw)) return raw.length > 0;

    const keys = Object.keys(obj).filter((k) => k !== "updatedAt");
    if (keys.length === 0) return false;

    return keys.some((k) => isMeaningfulGeneric(obj[k]));
  }

  if (typeof raw === "string") return raw.trim().length > 0;

  return true;
}

function isStepComplete(stepId: string, raw: unknown): boolean {
  if (!isMeaningfulGeneric(raw)) return false;

  // unwrap { value, updatedAt } if stored that way
  let val: unknown = raw;
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, any>;
    if ("value" in obj && "updatedAt" in obj) val = obj.value;
  }

  if (stepId === "1-6") {
    if (!val || typeof val !== "object" || Array.isArray(val)) return isMeaningfulGeneric(val);
    const obj = val as Record<string, any>;
    const { method, updatedAt, ...rest } = obj;
    return Object.keys(rest).some((k) => isMeaningfulGeneric(rest[k]));
  }

  if (stepId === "1-10") {
    if (!val || typeof val !== "object" || Array.isArray(val)) return isMeaningfulGeneric(val);
    const obj = val as Record<string, any>;

    const rationaleFilled = typeof obj.rationale === "string" && obj.rationale.trim().length > 0;
    const nextActionsFilled = typeof obj.nextActions === "string" && obj.nextActions.trim().length > 0;

    const scoreKeys = ["evidenceQuality", "severity", "willingnessToPay", "feasibility", "differentiation"] as const;
    const anyScoreAboveZero = scoreKeys.some((k) => typeof obj[k] === "number" && obj[k] > 0);

    const anyChecklistTrue =
      obj.artifactsChecklist &&
      typeof obj.artifactsChecklist === "object" &&
      Object.values(obj.artifactsChecklist as Record<string, any>).some(Boolean);

    return rationaleFilled || nextActionsFilled || anyScoreAboveZero || anyChecklistTrue;
  }

  return isMeaningfulGeneric(val);
}

function isObject(x: unknown): x is Record<string, any> {
  return typeof x === "object" && x !== null;
}

function unwrapStepValue(raw: any): any {
  if (isObject(raw) && "value" in raw && "updatedAt" in raw) return (raw as any).value;
  return raw;
}

function getStepValueFromDossier(dossier: Dossier | null, stepId: string): any {
  if (!dossier) return null;
  const raw = (dossier.steps as any)?.[stepId];
  return unwrapStepValue(raw);
}

function getStepUpdatedAtFromDossier(dossier: Dossier | null, stepId: string): string | null {
  if (!dossier) return null;
  const raw = (dossier.steps as any)?.[stepId];
  if (!raw) return null;
  if (isObject(raw) && typeof raw.updatedAt === "string") return raw.updatedAt;
  if (isObject(raw) && "value" in raw && typeof (raw as any).updatedAt === "string") return (raw as any).updatedAt;
  if (isObject(raw) && isObject((raw as any).value) && typeof (raw as any).value.updatedAt === "string")
    return (raw as any).value.updatedAt;
  return null;
}

function trimPreview(s: string, n: number): string {
  const t = (s || "").trim();
  if (!t) return "";
  if (t.length <= n) return t;
  return t.slice(0, n).trimEnd() + "…";
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text.trim()) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      window.prompt("Copy this text:", text);
      return true;
    } catch {
      return false;
    }
  }
}

/* ---------- Gate decision summary (from Step 1.10) ---------- */

type GateDecision = "go" | "one-iteration" | "stop";

type Step110Summary = {
  ok: boolean;
  updatedAt: string | null;
  decision: GateDecision;
  totalScore: number; // /50
  rationale: string;
  nextActions: string;
  auto14: string;
  auto16: string;
  note?: string;
};

function decisionLabel(d: GateDecision): string {
  if (d === "go") return "GO";
  if (d === "stop") return "STOP";
  return "ONE-ITERATION";
}

function extractStep110Summary(dossier: Dossier | null): Step110Summary {
  const v = getStepValueFromDossier(dossier, "1-10");
  const updatedAt = getStepUpdatedAtFromDossier(dossier, "1-10");

  const empty: Step110Summary = {
    ok: false,
    updatedAt,
    decision: "one-iteration",
    totalScore: 0,
    rationale: "",
    nextActions: "",
    auto14: "",
    auto16: "",
    note: "Step 1.10 is empty.",
  };

  if (!v) return empty;
  if (!isObject(v)) return { ...empty, note: "Step 1.10 payload is not an object." };

  const decisionRaw = String((v as any).decision ?? "one-iteration") as GateDecision;
  const decision: GateDecision = decisionRaw === "go" || decisionRaw === "stop" || decisionRaw === "one-iteration" ? decisionRaw : "one-iteration";

  const totalScore =
    Number((v as any).evidenceQuality ?? 0) +
    Number((v as any).severity ?? 0) +
    Number((v as any).willingnessToPay ?? 0) +
    Number((v as any).feasibility ?? 0) +
    Number((v as any).differentiation ?? 0);

  const rationale = String((v as any).rationale ?? "");
  const nextActions = String((v as any).nextActions ?? "");
  const autoEvidence = isObject((v as any).autoEvidence) ? (v as any).autoEvidence : {};
  const auto14 = String(autoEvidence.step14 ?? "");
  const auto16 = String(autoEvidence.step16 ?? "");

  const ok = Boolean((rationale || "").trim()) || Boolean((nextActions || "").trim()) || totalScore > 0 || Boolean((auto14 || "").trim()) || Boolean((auto16 || "").trim());

  return { ok, updatedAt, decision, totalScore, rationale, nextActions, auto14, auto16 };
}

/* ---------- Light live summaries from 1.4 and 1.6 (for print-friendly output) ---------- */

function extract14Titles(dossier: Dossier | null): { m1: string; m2: string } {
  const v = getStepValueFromDossier(dossier, "1-4");
  if (!v || !isObject(v)) return { m1: "", m2: "" };
  const m1 = isObject((v as any).leadMetric1) ? String((v as any).leadMetric1.name ?? "").trim() : "";
  const m2 = isObject((v as any).leadMetric2) ? String((v as any).leadMetric2.name ?? "").trim() : "";
  return { m1, m2 };
}

function extract16Counts(dossier: Dossier | null): { note: string; sessions: number; mappedPct: number; avgSeverity: number; topPains: Array<[string, number]> } {
  const v = getStepValueFromDossier(dossier, "1-6");
  if (!v || !isObject(v)) return { note: "—", sessions: 0, mappedPct: 0, avgSeverity: 0, topPains: [] };

  const version = String((v as any).version ?? "unknown");
  if (version !== "1.6-v2") return { note: "Step 1.6 not v2 (open Step 1.6 once to migrate).", sessions: 0, mappedPct: 0, avgSeverity: 0, topPains: [] };

  const sessions: any[] = Array.isArray((v as any).sessions) ? (v as any).sessions : [];
  let unmapped = 0;
  let sevSum = 0;
  let sevN = 0;
  const painCounts: Record<string, number> = {};

  for (const s of sessions) {
    if (!isObject(s)) continue;

    const mapped = Array.isArray((s as any).mappedMetrics) ? (s as any).mappedMetrics.map(String).filter(Boolean) : [];
    if (mapped.length === 0) unmapped += 1;

    const sev = Number((s as any).severity010 ?? 0);
    if (Number.isFinite(sev)) {
      sevSum += Math.max(0, Math.min(10, sev));
      sevN += 1;
    }

    const pains = [String((s as any).pain1 ?? ""), String((s as any).pain2 ?? ""), String((s as any).pain3 ?? "")]
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.toLowerCase());

    for (const p of pains) painCounts[p] = (painCounts[p] ?? 0) + 1;
  }

  const total = sessions.length;
  const mappedPct = total ? Math.round(((total - unmapped) / total) * 100) : 0;
  const avgSeverity = sevN ? Math.round((sevSum / sevN) * 10) / 10 : 0;
  const topPains = Object.entries(painCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return { note: "", sessions: total, mappedPct, avgSeverity, topPains };
}

function buildPrintSummary(dossier: Dossier, dossierId: string, s110: Step110Summary): string {
  const lines: string[] = [];
  lines.push(`Dossier summary`);
  lines.push(`Project: ${dossier.meta?.projectName || "Untitled dossier"}`);
  lines.push(`Dossier ID: ${dossierId}`);
  lines.push(`Updated: ${formatDateTime(dossier.updatedAt)}`);
  lines.push("");

  lines.push("1.1 Problem");
  lines.push(dossier.meta?.oneLineProblem ? String(dossier.meta.oneLineProblem).trim() : "—");
  lines.push("");

  const m14 = extract14Titles(dossier);
  lines.push("1.4 Lead metrics (names)");
  lines.push(`- Lead metric 1: ${m14.m1 || "—"}`);
  lines.push(`- Lead metric 2: ${m14.m2 || "—"}`);
  lines.push("");

  const c16 = extract16Counts(dossier);
  lines.push("1.6 Evidence (live counts)");
  if (c16.note) {
    lines.push(c16.note);
  } else {
    lines.push(`- Sessions: ${c16.sessions}`);
    lines.push(`- Mapped: ${c16.mappedPct}%`);
    lines.push(`- Avg severity: ${c16.avgSeverity}`);
    lines.push(`- Top pains: ${c16.topPains.length ? c16.topPains.map(([p, n]) => `${p} (${n})`).join(", ") : "—"}`);
  }
  lines.push("");

  lines.push("1.10 Gate decision");
  lines.push(`Decision: ${decisionLabel(s110.decision)} · Score: ${s110.totalScore}/50`);
  if (s110.updatedAt) lines.push(`Last updated: ${formatDateTime(s110.updatedAt)}`);
  lines.push("");
  lines.push("Rationale:");
  lines.push(s110.rationale.trim() ? s110.rationale.trim() : "—");
  lines.push("");
  lines.push("Next actions:");
  lines.push(s110.nextActions.trim() ? s110.nextActions.trim() : "—");
  lines.push("");

  lines.push("1.10 Saved evidence snapshots");
  lines.push("");
  lines.push("Snapshot from 1.4:");
  lines.push(s110.auto14.trim() ? s110.auto14.trim() : "—");
  lines.push("");
  lines.push("Snapshot from 1.6:");
  lines.push(s110.auto16.trim() ? s110.auto16.trim() : "—");

  return lines.join("\n");
}

/* ---------- Page ---------- */

export default function ReviewPage() {
  const sp = useSearchParams();

  const dossierId = useMemo(() => {
    const d = sp.get("d")?.trim();
    return d && isUuidLike(d) ? d : null;
  }, [sp]);

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(true);
  const [review, setReview] = useState<ReviewerV1>(() => defaultReviewer());
  const [reviewSaveMsg, setReviewSaveMsg] = useState<string>("");

  const reviewTimerRef = useRef<number | null>(null);

  const [copyMsg, setCopyMsg] = useState<string>("");

  // new: summary copy feedback
  const [copySummaryMsg, setCopySummaryMsg] = useState<string>("");

  useEffect(() => {
    if (!dossierId) {
      setDossier(null);
      setIsReady(true);
      return;
    }

    const d = safeGetDossier(dossierId);
    setDossier(d);

    const existing = (d?.meta as any)?.reviewerV1;
    if (existing && typeof existing === "object" && existing.version === "reviewer-v1") {
      const loaded: ReviewerV1 = {
        version: "reviewer-v1",
        updatedAt: typeof existing.updatedAt === "string" ? existing.updatedAt : nowIso(),
        scores: {
          problem: clampScore(Number(existing?.scores?.problem ?? 0)),
          stakeholders: clampScore(Number(existing?.scores?.stakeholders ?? 0)),
          metrics: clampScore(Number(existing?.scores?.metrics ?? 0)),
          evidence: clampScore(Number(existing?.scores?.evidence ?? 0)),
          decision: clampScore(Number(existing?.scores?.decision ?? 0)),
        },
        notes: {
          problem: String(existing?.notes?.problem ?? ""),
          stakeholders: String(existing?.notes?.stakeholders ?? ""),
          metrics: String(existing?.notes?.metrics ?? ""),
          evidence: String(existing?.notes?.evidence ?? ""),
          decision: String(existing?.notes?.decision ?? ""),
        },
        overallNotes: String(existing?.overallNotes ?? ""),
      };
      setReview(loaded);
    } else {
      setReview(defaultReviewer());
    }

    setReviewSaveMsg("");
    setIsReady(true);
  }, [dossierId]);

  const completedCount = useMemo(() => {
    if (!dossier) return 0;
    return STEPS.reduce((acc, s) => {
      const raw = (dossier.steps as any)?.[s.id];
      return acc + (isStepComplete(s.id, raw) ? 1 : 0);
    }, 0);
  }, [dossier]);

  const totalScore = useMemo(() => {
    return (Object.values(review.scores) as number[]).reduce((a, b) => a + b, 0);
  }, [review.scores]);

  // new: gate summary
  const gate = useMemo(() => extractStep110Summary(dossier ?? null), [dossier]);
  const gatePreview = useMemo(() => trimPreview(gate.rationale, 260), [gate.rationale]);

  const printSummaryText = useMemo(() => {
    if (!dossierId || !dossier) return "";
    return buildPrintSummary(dossier, dossierId, gate);
  }, [dossier, dossierId, gate]);

  useEffect(() => {
    if (!dossierId) return;
    if (!isReady) return;

    if (reviewTimerRef.current) {
      window.clearTimeout(reviewTimerRef.current);
      reviewTimerRef.current = null;
    }

    reviewTimerRef.current = window.setTimeout(() => {
      const d = safeGetDossier(dossierId);
      if (!d) {
        setReviewSaveMsg("Reviewer save unavailable");
        return;
      }

      const toSave: ReviewerV1 = {
        ...review,
        updatedAt: nowIso(),
        scores: {
          problem: clampScore(review.scores.problem),
          stakeholders: clampScore(review.scores.stakeholders),
          metrics: clampScore(review.scores.metrics),
          evidence: clampScore(review.scores.evidence),
          decision: clampScore(review.scores.decision),
        },
      };

      d.meta = d.meta ?? ({} as any);
      (d.meta as any).reviewerV1 = toSave;
      d.updatedAt = nowIso();

      safeUpsertDossier(d);
      setDossier(d);
      setReviewSaveMsg(`Reviewer saved ${new Date().toLocaleTimeString()}`);
    }, 350);

    return () => {
      if (reviewTimerRef.current) {
        window.clearTimeout(reviewTimerRef.current);
        reviewTimerRef.current = null;
      }
    };
  }, [review, dossierId, isReady]);

  const sprintHref = useMemo(() => {
    return (sprint: "A" | "B" | "C") => {
      if (!dossierId) return "/intake";
      const slug =
        sprint === "A"
          ? "/sprints/sprint-a"
          : sprint === "B"
          ? "/sprints/sprint-b"
          : "/sprints/sprint-c";
      return withDossier(slug, dossierId);
    };
  }, [dossierId]);

  const stepHref = useMemo(() => {
    return (stepId: string) => {
      if (!dossierId) return "/intake";
      return withDossier(`/steps/${stepId}`, dossierId);
    };
  }, [dossierId]);

  const shareHref = useMemo(() => {
    if (!dossierId) return "";
    const path = withDossier("/review", dossierId);
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [dossierId]);

  function onCopyShareLink() {
    if (!shareHref) return;
    setCopyMsg("");

    try {
      navigator.clipboard
        .writeText(shareHref)
        .then(() => setCopyMsg("Copied share link"))
        .catch(() => {
          window.prompt("Copy this link:", shareHref);
          setCopyMsg("Share link shown");
        });
    } catch {
      window.prompt("Copy this link:", shareHref);
      setCopyMsg("Share link shown");
    }
  }

  function onPrint() {
    if (typeof window === "undefined") return;
    window.print();
  }

  function onExport() {
    if (!dossierId) return;
    const raw = exportDossier(dossierId);
    if (!raw) return;

    const safeName = (dossier?.meta?.projectName || "dossier").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    downloadTextFile(`${safeName}-${dossierId}.json`, raw);
  }

  async function onCopySummary() {
    setCopySummaryMsg("");
    const ok = await copyTextToClipboard(printSummaryText || "");
    setCopySummaryMsg(ok ? "Copied summary" : "Copy failed");
  }

  if (!isReady) {
    return (
      <main style={pageStyle}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!dossierId) {
    return (
      <main style={pageStyle}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Review</h1>
        <p style={{ marginTop: 10 }}>
          No dossier in the URL. Go to <Link href="/intake">/intake</Link>.
        </p>
      </main>
    );
  }

  if (!dossier) {
    return (
      <main style={pageStyle}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Review</h1>
        <p style={{ marginTop: 10 }}>
          That dossier ID doesn’t exist in storage. Go to <Link href="/intake">/intake</Link>.
        </p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Review</h1>

      <div style={{ marginTop: 10, opacity: 0.8 }}>
        <div>
          <strong>Project:</strong> {dossier.meta?.projectName || "Untitled dossier"}
        </div>
        <div style={{ marginTop: 4 }}>
          <strong>Dossier ID:</strong> <code>{dossierId}</code>
        </div>
        <div style={{ marginTop: 4 }}>
          <strong>Progress:</strong> {completedCount}/{STEPS.length} steps completed
        </div>
        <div style={{ marginTop: 4 }}>
          <strong>Last visited:</strong> <code>{(dossier as any)?.lastVisitedStepId || "1-1"}</code>
        </div>
        <div style={{ marginTop: 4 }}>
          <strong>Updated:</strong> {formatDateTime(dossier.updatedAt)}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" style={btnStyle} onClick={onExport}>
          Export JSON
        </button>

        <button type="button" style={btnStyle} onClick={onCopyShareLink}>
          Copy share link
        </button>

        <button type="button" style={btnStyle} onClick={onPrint}>
          Print / Save as PDF
        </button>

        <Link href={stepHref((dossier as any)?.lastVisitedStepId || "1-1")} style={linkBtnStyle}>
          Resume →
        </Link>

        <Link href="/intake" style={linkBtnStyle}>
          Back to Intake
        </Link>
      </div>

      {copyMsg ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{copyMsg}</div> : null}

      {/* NEW: Gate decision at the top */}
      <Section title="Gate decision (from Step 1.10)">
        {gate.ok ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>Decision</div>
                <div style={{ fontSize: 26, fontWeight: 1000 }}>{decisionLabel(gate.decision)}</div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                  Score: <strong>{gate.totalScore}/50</strong>
                  {gate.updatedAt ? ` · Updated ${formatDateTime(gate.updatedAt)}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={stepHref("1-10")} style={linkBtnStyle}>
                  Open 1.10 →
                </Link>
              </div>
            </div>

            <div style={{ fontSize: 13, opacity: 0.9 }}>
              <strong>Rationale preview:</strong> {gatePreview || "—"}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            No meaningful Step 1.10 decision yet.{" "}
            <Link href={stepHref("1-10")} style={{ textDecoration: "underline" }}>
              Open Step 1.10 →
            </Link>
          </div>
        )}
      </Section>

      {/* NEW: Print-friendly dossier summary */}
      <Section title="Print-friendly dossier summary">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" style={btnStyle} onClick={onCopySummary}>
            Copy summary
          </button>
          {copySummaryMsg ? <span style={{ fontSize: 12, opacity: 0.75 }}>{copySummaryMsg}</span> : null}
        </div>
        <pre style={summaryPreStyle}>{printSummaryText}</pre>
      </Section>

      <Section title="Reviewer mode">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ opacity: 0.8 }}>
            <strong>Score:</strong> {totalScore}/10{" "}
            <span style={{ fontSize: 12, opacity: 0.7 }}>(0–2 each across 5 criteria)</span>
          </div>

          <button type="button" style={btnStyle} onClick={() => setReviewOpen((x) => !x)}>
            {reviewOpen ? "Hide rubric" : "Show rubric"}
          </button>
        </div>

        {reviewSaveMsg ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{reviewSaveMsg}</div> : null}

        {reviewOpen ? (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {RUBRIC.map((r) => {
              const score = review.scores[r.key] ?? 0;
              const note = review.notes[r.key] ?? "";

              return (
                <div key={r.key} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontWeight: 900 }}>{r.label}</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>{r.hint}</div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ fontWeight: 800, fontSize: 12, opacity: 0.8 }}>Score</label>
                    <select
                      value={String(score)}
                      onChange={(e) => {
                        const n = clampScore(parseInt(e.target.value, 10));
                        setReview((prev) => ({
                          ...prev,
                          scores: { ...prev.scores, [r.key]: n },
                        }));
                      }}
                      style={selectStyle}
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontWeight: 800, display: "block" }}>Reviewer notes</label>
                    <textarea
                      value={note}
                      onChange={(e) => {
                        const v = e.target.value;
                        setReview((prev) => ({
                          ...prev,
                          notes: { ...prev.notes, [r.key]: v },
                        }));
                      }}
                      style={textareaStyle(90)}
                      placeholder="What’s missing or weak? What would strengthen this?"
                    />
                  </div>
                </div>
              );
            })}

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 900 }}>Overall notes</div>
              <textarea
                value={review.overallNotes}
                onChange={(e) => setReview((prev) => ({ ...prev, overallNotes: e.target.value }))}
                style={textareaStyle(120)}
                placeholder="Summary: why this is Go / One-iteration / Stop."
              />
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Meta">
        <Grid2>
          <MetaRow label="Organisation" value={dossier.meta?.organisation || ""} />
          <MetaRow label="Primary user" value={dossier.meta?.primaryUser || ""} />
          <MetaRow label="Setting" value={dossier.meta?.setting || ""} />
          <MetaRow label="One-line problem" value={dossier.meta?.oneLineProblem || ""} />
        </Grid2>
        {dossier.meta?.notes ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800 }}>Notes</div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{dossier.meta.notes}</div>
          </div>
        ) : null}
      </Section>

      <Section title="Steps">
        <div style={{ display: "grid", gap: 10 }}>
          {STEPS.map((s) => {
            const raw = (dossier.steps as any)?.[s.id];
            const done = isStepComplete(s.id, raw);
            const updatedAt = getStepUpdatedAt(raw);

            return (
              <div key={s.id} style={rowCardStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900 }}>
                    {done ? "✅" : "⬜"} {s.title}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    Sprint {s.sprint}
                    {updatedAt ? ` · Updated ${formatDateTime(updatedAt)}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href={stepHref(s.id)} style={linkBtnStyle}>
                    Open →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </main>
  );
}

/* ---------- UI bits ---------- */

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{props.title}</h2>
      <div style={{ marginTop: 12 }}>{props.children}</div>
    </div>
  );
}

function Grid2(props: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{props.children}</div>;
}

function MetaRow(props: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 12, opacity: 0.8 }}>{props.label}</div>
      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
        {props.value || <span style={{ opacity: 0.5 }}>—</span>}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: 24,
  fontFamily: "system-ui",
  maxWidth: 980,
  width: "100%",
  margin: "0 auto",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  background: "transparent",
  cursor: "pointer",
};

const linkBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  textDecoration: "none",
};

const rowCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 14,
  display: "flex",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
};

const selectStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontFamily: "system-ui",
  background: "transparent",
  color: "inherit",
};

const summaryPreStyle: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
  whiteSpace: "pre-wrap",
  fontSize: 12,
  lineHeight: 1.55,
  overflowX: "auto",
};

function textareaStyle(minHeight: number): React.CSSProperties {
  return {
    marginTop: 8,
    width: "100%",
    minHeight,
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 12,
    fontFamily: "system-ui",
    background: "transparent",
    color: "inherit",
    boxSizing: "border-box",
  };
}

