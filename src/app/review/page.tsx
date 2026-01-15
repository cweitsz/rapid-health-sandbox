// src/app/review/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dossier } from "@/lib/dossier";
import { isUuidLike } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";
import { getDossier, exportDossier, downloadTextFile, upsertDossier } from "@/lib/storage";
import ReviewerGate from "@/components/ReviewerGate";

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

/**
 * Generic “has anything been filled” check.
 * - unwrap { value, updatedAt } if present
 * - strings must be non-empty
 * - arrays must have items
 * - objects must have at least one meaningful field besides updatedAt
 * - primitives count as meaningful (handled more strictly per-step where needed)
 */
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

  // numbers/booleans count generically as meaningful
  return true;
}

/**
 * Step-aware completion:
 * - Step 1.6 should NOT tick just because method has a default.
 * - Step 1.10 should NOT tick just because decision defaults to "iterate" or scores are 0.
 */
function isStepComplete(stepId: string, raw: unknown): boolean {
  if (!isMeaningfulGeneric(raw)) return false;

  // unwrap { value, updatedAt } if stored that way
  let val: unknown = raw;
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, any>;
    if ("value" in obj && "updatedAt" in obj) val = obj.value;
  }

  // Step 1.6: ignore `method` (defaults to "mixed")
  if (stepId === "1-6") {
    if (!val || typeof val !== "object" || Array.isArray(val)) return isMeaningfulGeneric(val);
    const obj = val as Record<string, any>;
    const { method, updatedAt, ...rest } = obj;
    return Object.keys(rest).some((k) => isMeaningfulGeneric(rest[k]));
  }

  // Step 1.10: require *actual* input
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

    // NOTE: we intentionally ignore `decision` alone (defaults to "iterate")
    return rationaleFilled || nextActionsFilled || anyScoreAboveZero || anyChecklistTrue;
  }

  // All other steps: generic check is fine
  return isMeaningfulGeneric(val);
}

export default function ReviewPage() {
  const sp = useSearchParams();

  // URL is canonical on dossier-bound routes.
  const dossierId = useMemo(() => {
    const d = sp.get("d")?.trim();
    return d && isUuidLike(d) ? d : null;
  }, [sp]);

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Reviewer state
  const [reviewOpen, setReviewOpen] = useState(true);
  const [review, setReview] = useState<ReviewerV1>(() => defaultReviewer());
  const [reviewSaveMsg, setReviewSaveMsg] = useState<string>("");

  const reviewTimerRef = useRef<number | null>(null);

  const [copyMsg, setCopyMsg] = useState<string>("");

  useEffect(() => {
    if (!dossierId) {
      setDossier(null);
      setIsReady(true);
      return;
    }

    const d = safeGetDossier(dossierId);
    setDossier(d);

    // load existing reviewer info if present
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

  // Debounced autosave reviewer meta (does NOT touch lastVisitedStepId)
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

      // IMPORTANT: do NOT setReview(updatedAt=now) or you create a save loop.
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

  // Landing page is "/" now. Do NOT attach ?d= to Home.
  const homeHref = "/";

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

    const safeName = (dossier?.meta?.projectName || "dossier")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .toLowerCase();

    downloadTextFile(`${safeName}-${dossierId}.json`, raw);
  }

  return (
    <ReviewerGate>
      {!isReady ? (
        <main style={{ padding: 24, fontFamily: "system-ui" }}>
          <p>Loading…</p>
        </main>
      ) : !dossierId ? (
        <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Review</h1>
          <p style={{ marginTop: 10 }}>
            No dossier in the URL. Go to <Link href="/intake">/intake</Link>.
          </p>
        </main>
      ) : !dossier ? (
        <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Review</h1>
          <p style={{ marginTop: 10 }}>
            That dossier ID doesn’t exist in storage. Go to <Link href="/intake">/intake</Link>.
          </p>
        </main>
      ) : (
        <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980 }}>
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

            <Link href={homeHref} style={linkBtnStyle}>
              Home
            </Link>

            <Link href={sprintHref("A")} style={linkBtnStyle}>
              Sprint A
            </Link>
            <Link href={sprintHref("B")} style={linkBtnStyle}>
              Sprint B
            </Link>
            <Link href={sprintHref("C")} style={linkBtnStyle}>
              Sprint C
            </Link>

            <Link href={stepHref((dossier as any)?.lastVisitedStepId || "1-1")} style={linkBtnStyle}>
              Resume →
            </Link>

            <Link href="/intake" style={linkBtnStyle}>
              Back to Intake
            </Link>
          </div>

          {copyMsg ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{copyMsg}</div> : null}

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
      )}
    </ReviewerGate>
  );
}

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
      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{props.value || <span style={{ opacity: 0.5 }}>—</span>}</div>
    </div>
  );
}

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
