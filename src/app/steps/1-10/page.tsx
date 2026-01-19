// src/app/steps/1-10/page.tsx
"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";
import type { Dossier } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";

const STEP_ID = "1-10";

// Soft “minimum evidence pack” thresholds (used in Step 1.6 summary)
const MIN_QUOTES = 10;
const MIN_BASELINE_SIGNALS = 2;

type GateDecision = "go" | "one-iteration" | "stop";

type Step110Payload = {
  decision: GateDecision;

  // 0–10 each
  evidenceQuality: number;
  severity: number;
  willingnessToPay: number;
  feasibility: number;
  differentiation: number;

  // stable keys (don’t rename unless you want migrations)
  artifactsChecklist: Record<string, boolean>;

  // user-written
  rationale: string;
  nextActions: string;

  // auto snapshots (human-readable)
  autoEvidence: {
    step14: string;
    step16: string;
  };

  updatedAt?: string;
};

const DEFAULT_PAYLOAD: Step110Payload = {
  decision: "one-iteration",
  evidenceQuality: 0,
  severity: 0,
  willingnessToPay: 0,
  feasibility: 0,
  differentiation: 0,
  artifactsChecklist: {
    step11_problem: false,
    step12_stakeholders: false,
    step13_workarounds: false,
    step14_metrics: false,
    step15_hypotheses: false,
    step16_evidencePlanOrLog: false,
    step17_beforeAfter: false,
    step18_alternatives: false,
    step19_valueHook: false,
  },
  rationale: "",
  nextActions: "",
  autoEvidence: {
    step14: "",
    step16: "",
  },
};

// UI labels for checklist (keep keys stable)
const ARTIFACT_LABELS: Record<string, string> = {
  step11_problem: "Step 1.1 Problem definition",
  step12_stakeholders: "Step 1.2 Stakeholders & owner/payer map",
  step13_workarounds: "Step 1.3 Workarounds & status quo",
  step14_metrics: "Step 1.4 Measurable indicators",
  step15_hypotheses: "Step 1.5 Disconfirming hypotheses",
  step16_evidencePlanOrLog: "Step 1.6 Validation interviews/observation",
  step17_beforeAfter: "Step 1.7 Before/after & solution hypothesis",
  step18_alternatives: "Step 1.8 Alternatives scan",
  step19_valueHook: "Step 1.9 Value hook",
};

function prettifyArtifactKey(k: string): string {
  const s = k
    .replace(/^step(\d{2})/, "Step $1")
    .replace(/_/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
  return s;
}

function isObject(x: unknown): x is Record<string, any> {
  return typeof x === "object" && x !== null;
}

function unwrapStepValue(raw: any): any {
  if (isObject(raw) && "value" in raw && "updatedAt" in raw) return (raw as any).value;
  return raw;
}

function getStepValue(dossier: Dossier | null, stepId: string): any {
  if (!dossier) return null;
  const raw = (dossier.steps as any)?.[stepId];
  return unwrapStepValue(raw);
}

function getStepUpdatedAt(dossier: Dossier | null, stepId: string): string | null {
  if (!dossier) return null;
  const raw = (dossier.steps as any)?.[stepId];
  if (!raw) return null;
  if (isObject(raw) && typeof raw.updatedAt === "string") return raw.updatedAt;
  if (isObject(raw) && "value" in raw && typeof (raw as any).updatedAt === "string") return (raw as any).updatedAt;
  if (isObject(raw) && isObject((raw as any).value) && typeof (raw as any).value.updatedAt === "string")
    return (raw as any).value.updatedAt;
  return null;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function toPrettyText(x: any): string {
  if (x == null) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "number" || typeof x === "boolean") return String(x);

  if (Array.isArray(x)) {
    return x.map(toPrettyText).filter(Boolean).join("\n");
  }

  if (isObject(x)) {
    // unwrap common wrapper shape: { value, updatedAt }
    if ("value" in x && typeof (x as any).value === "string") return String((x as any).value).trim();
    try {
      return JSON.stringify(x, null, 2);
    } catch {
      return String(x);
    }
  }

  return String(x);
}

function firstIntFromString(s: string): number | null {
  const m = (s || "").match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function decisionLabel(d: GateDecision): string {
  if (d === "go") return "GO";
  if (d === "stop") return "STOP";
  return "ONE-ITERATION";
}

function decisionHint(d: GateDecision): string {
  if (d === "go") return "Proceed. You’ve got enough signal to justify building/testing the next thing.";
  if (d === "stop") return "Stop. Capture learning and don’t sink more time into a low-signal path.";
  return "One more tight loop. Narrow the uncertainty, then decide again quickly.";
}

function trimPreview(s: string, n: number): string {
  const t = (s || "").trim();
  if (!t) return "";
  if (t.length <= n) return t;
  return t.slice(0, n).trimEnd() + "…";
}

/* ---------- Step 1.4 snapshot extraction ---------- */

type MetricSummary = {
  name: string;
  definition?: string;
  baseline: string;
  target: string;
  howMeasured: string;
  window: string;
};

type Step14Summary = {
  ok: boolean;
  metrics: MetricSummary[];
  guardrails: string;
  measurementPlan: string;
  updatedAt: string | null;
  note?: string;
};

function normalizeMetric(raw: any): MetricSummary {
  const obj = isObject(raw) ? raw : {};
  const def = String(obj.definition ?? "").trim();
  return {
    name: String(obj.name ?? "").trim(),
    definition: def ? def : undefined,
    baseline: String(obj.baseline ?? "").trim(),
    target: String(obj.target ?? "").trim(),
    howMeasured: String(obj.howMeasured ?? obj.method ?? "").trim(),
    window: String(obj.window ?? obj.frequency ?? "").trim(),
  };
}

function extractStep14Summary(dossier: Dossier | null): Step14Summary {
  const v = getStepValue(dossier, "1-4");
  const updatedAt = getStepUpdatedAt(dossier, "1-4");

  if (!v) {
    return { ok: false, metrics: [], guardrails: "", measurementPlan: "", updatedAt, note: "Step 1.4 is empty." };
  }

  if (!isObject(v)) {
    return {
      ok: false,
      metrics: [],
      guardrails: "",
      measurementPlan: "",
      updatedAt,
      note: "Step 1.4 is not an object payload.",
    };
  }

  const m1 = (v as any).leadMetric1 ?? null;
  const m2 = (v as any).leadMetric2 ?? null;

  const metrics: MetricSummary[] = [];
  if (m1) metrics.push(normalizeMetric(m1));
  if (m2) metrics.push(normalizeMetric(m2));

  const guardrails = toPrettyText((v as any).guardrails);
  const measurementPlan = toPrettyText((v as any).measurementPlan ?? (v as any).plan);

  const anyMetric = metrics.some((m) =>
    Boolean((m.name || m.definition || m.baseline || m.target || m.howMeasured || m.window || "").trim())
  );

  const ok = anyMetric || Boolean((guardrails || "").trim()) || Boolean((measurementPlan || "").trim());

  return { ok, metrics, guardrails, measurementPlan, updatedAt };
}

function buildStep14SnapshotText(s14: Step14Summary): string {
  const lines: string[] = [];
  lines.push("Step 1.4 Evidence snapshot");
  if (s14.updatedAt) lines.push(`Last updated: ${formatDateTime(s14.updatedAt)}`);
  lines.push("");

  if (!s14.ok) {
    lines.push(s14.note ?? "No usable Step 1.4 data found.");
    return lines.join("\n").trim();
  }

  if (s14.metrics.length === 0) {
    lines.push("No lead metrics found.");
  } else {
    s14.metrics.forEach((m, idx) => {
      lines.push(`Lead metric ${idx + 1}: ${m.name || "—"}`);
      if (m.definition) lines.push(`- Definition: ${m.definition}`);
      lines.push(`- Baseline: ${m.baseline || "—"}`);
      lines.push(`- Target: ${m.target || "—"}`);
      lines.push(`- How measured: ${m.howMeasured || "—"}`);
      lines.push(`- Window/frequency: ${m.window || "—"}`);
      lines.push("");
    });
  }

  lines.push("Guardrails:");
  lines.push(s14.guardrails ? s14.guardrails : "—");
  lines.push("");
  lines.push("Measurement plan:");
  lines.push(s14.measurementPlan ? s14.measurementPlan : "—");

  return lines.join("\n").trim();
}

function foundMeaningfulStep14(s: Step14Summary): boolean {
  if (!s.ok) return false;

  const anyMetric = s.metrics.some((m) =>
    Boolean((m.name || m.definition || m.baseline || m.target || m.howMeasured || m.window || "").trim())
  );

  return anyMetric || Boolean((s.guardrails || "").trim()) || Boolean((s.measurementPlan || "").trim());
}

/* ---------- Step 1.6 snapshot extraction ---------- */

type Step16Summary = {
  ok: boolean;
  version: string;
  updatedAt: string | null;

  totalSessions: number;
  byKind: { interview: number; observation: number; artifact: number };

  avgSeverity: number;

  unmappedCount: number;
  mappedPct: number;

  totalQuotes: number;
  baselineSignalCount: number;
  workaroundCount: number;

  metricCounts: Record<string, number>;
  topPains: Array<[string, number]>;

  evidencePack: {
    targetN: number;
    passSessions: boolean;
    passQuotes: boolean;
    passWorkaround: boolean;
    passBaselineSignals: boolean;
    passConsent: boolean;
    identifiableInfoStored: boolean;
  };

  note?: string;
};

function extractStep16Summary(dossier: Dossier | null): Step16Summary {
  const v = getStepValue(dossier, "1-6");
  const updatedAt = getStepUpdatedAt(dossier, "1-6");

  const empty: Step16Summary = {
    ok: false,
    version: "unknown",
    updatedAt,
    totalSessions: 0,
    byKind: { interview: 0, observation: 0, artifact: 0 },
    avgSeverity: 0,
    unmappedCount: 0,
    mappedPct: 0,
    totalQuotes: 0,
    baselineSignalCount: 0,
    workaroundCount: 0,
    metricCounts: {},
    topPains: [],
    evidencePack: {
      targetN: 6,
      passSessions: false,
      passQuotes: false,
      passWorkaround: false,
      passBaselineSignals: false,
      passConsent: false,
      identifiableInfoStored: false,
    },
    note: "Step 1.6 is empty or not migrated.",
  };

  if (!v) return empty;
  if (!isObject(v)) return { ...empty, note: "Step 1.6 payload is not an object." };

  const version = String((v as any).version ?? "unknown");

  if (version !== "1.6-v2") {
    const ok =
      Boolean(String((v as any).targetParticipants ?? "").trim()) ||
      Boolean(String((v as any).whatCountsAsPassFail ?? "").trim()) ||
      Boolean(String((v as any).schedulePlan ?? "").trim());
    return {
      ...empty,
      ok,
      version,
      note: "Step 1.6 isn’t on v2, so the evidence summary is unavailable. (Open Step 1.6 once to migrate.)",
    };
  }

  const sessions: any[] = Array.isArray((v as any).sessions) ? (v as any).sessions : [];
  const byKind = { interview: 0, observation: 0, artifact: 0 };

  let sevSum = 0;
  let sevN = 0;

  let unmappedCount = 0;
  let totalQuotes = 0;
  let baselineSignalCount = 0;
  let workaroundCount = 0;

  const metricCounts: Record<string, number> = {};
  const painCounts: Record<string, number> = {};

  for (const s of sessions) {
    if (!isObject(s)) continue;

    const kind = String((s as any).kind ?? "interview") as keyof typeof byKind;
    if (kind in byKind) (byKind as any)[kind] += 1;

    const mapped = Array.isArray((s as any).mappedMetrics)
      ? (s as any).mappedMetrics.map(String).filter(Boolean)
      : [];
    if (mapped.length === 0) unmappedCount += 1;

    const quotes = [String((s as any).quote1 ?? ""), String((s as any).quote2 ?? ""), String((s as any).quote3 ?? "")]
      .map((q) => q.trim())
      .filter(Boolean);
    totalQuotes += quotes.length;

    if (String((s as any).baselineSignal ?? "").trim()) baselineSignalCount += 1;
    if (String((s as any).workaround ?? "").trim()) workaroundCount += 1;

    const sev = Number((s as any).severity010 ?? 0);
    if (Number.isFinite(sev)) {
      sevSum += Math.max(0, Math.min(10, sev));
      sevN += 1;
    }

    for (const mk of mapped) metricCounts[mk] = (metricCounts[mk] ?? 0) + 1;

    const pains = [String((s as any).pain1 ?? ""), String((s as any).pain2 ?? ""), String((s as any).pain3 ?? "")]
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.toLowerCase());

    for (const p of pains) painCounts[p] = (painCounts[p] ?? 0) + 1;
  }

  const topPains = Object.entries(painCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const avgSeverity = sevN ? Math.round((sevSum / sevN) * 10) / 10 : 0;

  const totalSessions = sessions.length;
  const mappedCount = Math.max(0, totalSessions - unmappedCount);
  const mappedPct = totalSessions ? Math.round((mappedCount / totalSessions) * 100) : 0;

  const sampleTargetStr = isObject((v as any).sampling) ? String((v as any).sampling.sampleTarget ?? "") : "";
  const targetN = firstIntFromString(sampleTargetStr) ?? 6;

  const consentObtained = Boolean(isObject((v as any).consent) ? (v as any).consent.consentObtained : false);
  const identifiableInfoStored = Boolean(isObject((v as any).consent) ? (v as any).consent.identifiableInfoStored : false);

  const evidencePack = {
    targetN,
    passSessions: totalSessions >= targetN,
    passQuotes: totalQuotes >= MIN_QUOTES,
    passWorkaround: workaroundCount >= 1,
    passBaselineSignals: baselineSignalCount >= MIN_BASELINE_SIGNALS,
    passConsent: consentObtained,
    identifiableInfoStored,
  };

  const ok =
    totalSessions > 0 ||
    Boolean(String((v as any).targetParticipants ?? "").trim()) ||
    Boolean(String((v as any).decisionRule ?? "").trim());

  return {
    ok,
    version,
    updatedAt,
    totalSessions,
    byKind,
    avgSeverity,
    unmappedCount,
    mappedPct,
    totalQuotes,
    baselineSignalCount,
    workaroundCount,
    metricCounts,
    topPains,
    evidencePack,
  };
}

function buildStep16SnapshotText(s16: Step16Summary): string {
  const lines: string[] = [];
  lines.push("Step 1.6 Evidence snapshot");
  if (s16.updatedAt) lines.push(`Last updated: ${formatDateTime(s16.updatedAt)} · Payload: ${s16.version}`);
  lines.push("");

  if (!s16.ok) {
    lines.push(s16.note ?? "No usable Step 1.6 data found.");
    return lines.join("\n").trim();
  }

  lines.push(
    `Sessions: ${s16.totalSessions} (Interview ${s16.byKind.interview}, Observation ${s16.byKind.observation}, Artifact ${s16.byKind.artifact})`
  );
  lines.push(`Mapped: ${Math.max(0, s16.totalSessions - s16.unmappedCount)}/${s16.totalSessions} (${s16.mappedPct}%)`);
  lines.push(`Unmapped sessions: ${s16.unmappedCount}`);
  lines.push(`Avg severity: ${s16.avgSeverity}`);
  lines.push(`Quotes captured: ${s16.totalQuotes}`);
  lines.push(`Baseline signals: ${s16.baselineSignalCount}/${s16.totalSessions}`);
  lines.push(`Workarounds captured: ${s16.workaroundCount}/${s16.totalSessions}`);
  lines.push("");

  lines.push("Evidence pack checklist (soft):");
  lines.push(`- Sessions (target ≥ ${s16.evidencePack.targetN}): ${s16.evidencePack.passSessions ? "PASS" : "FAIL"}`);
  lines.push(`- Quotes (target ≥ ${MIN_QUOTES}): ${s16.evidencePack.passQuotes ? "PASS" : "FAIL"}`);
  lines.push(`- Workaround captured: ${s16.evidencePack.passWorkaround ? "PASS" : "FAIL"}`);
  lines.push(
    `- Baseline signals (target ≥ ${MIN_BASELINE_SIGNALS}): ${s16.evidencePack.passBaselineSignals ? "PASS" : "FAIL"}`
  );
  lines.push(`- Consent addressed: ${s16.evidencePack.passConsent ? "PASS" : "FAIL"}`);
  if (s16.evidencePack.identifiableInfoStored) lines.push(`- ⚠ Identifiable info stored: TRUE`);
  lines.push("");

  lines.push("Metric mapping counts:");
  lines.push(`- leadMetric1: ${s16.metricCounts["leadMetric1"] ?? 0}`);
  lines.push(`- leadMetric2: ${s16.metricCounts["leadMetric2"] ?? 0}`);
  lines.push("");

  lines.push("Top pains (by frequency):");
  if (s16.topPains.length === 0) {
    lines.push("- —");
  } else {
    for (const [p, n] of s16.topPains) lines.push(`- ${p} (${n})`);
  }

  return lines.join("\n").trim();
}

function foundMeaningfulStep16(s: Step16Summary): boolean {
  if (!s.ok) return false;
  return s.totalSessions > 0;
}

/* ---------- clipboard helpers ---------- */

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

/* ---------- Decision banner ---------- */

function DecisionBanner(props: {
  decision: GateDecision;
  totalScore: number;
  rationalePreview: string;
  has14: boolean;
  has16: boolean;
  s16?: Step16Summary;
}) {
  const label = decisionLabel(props.decision);
  const hint = decisionHint(props.decision);

  const chip = (text: string) => (
    <span
      style={{
        border: "1px solid #ddd",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 800,
        opacity: 0.9,
      }}
    >
      {text}
    </span>
  );

  const evChips: ReactNode[] = [];
  evChips.push(chip(`Score ${props.totalScore}/50`));
  evChips.push(chip(props.has14 ? "1.4 snapshot: saved" : "1.4 snapshot: none"));
  evChips.push(chip(props.has16 ? "1.6 snapshot: saved" : "1.6 snapshot: none"));

  if (props.s16 && props.s16.ok && props.s16.totalSessions > 0) {
    evChips.push(chip(`Sessions: ${props.s16.totalSessions}`));
    evChips.push(chip(`Mapped: ${props.s16.mappedPct}%`));
    evChips.push(chip(`Avg sev: ${props.s16.avgSeverity}`));
  }

  return (
    <div style={bannerStyle}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.6, opacity: 0.8 }}>GATE DECISION</div>
          <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 2 }}>{label}</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>{hint}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{evChips}</div>
      </div>

      {props.rationalePreview ? (
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
          <strong>Rationale preview:</strong> {props.rationalePreview}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
          <strong>Rationale preview:</strong> — (write it like someone will challenge you)
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

export default function Step110Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step110Payload>(STEP_ID, DEFAULT_PAYLOAD);

  const s14 = useMemo(() => extractStep14Summary(dossier ?? null), [dossier]);
  const s16 = useMemo(() => extractStep16Summary(dossier ?? null), [dossier]);

  const [populateMsg14, setPopulateMsg14] = useState("");
  const [populateMsg16, setPopulateMsg16] = useState("");
  const [copyMsg14, setCopyMsg14] = useState("");
  const [copyMsg16, setCopyMsg16] = useState("");

  const step14Href = useMemo(() => (dossierId ? withDossier("/steps/1-4", dossierId) : "/intake"), [dossierId]);
  const step16Href = useMemo(() => (dossierId ? withDossier("/steps/1-6", dossierId) : "/intake"), [dossierId]);

  const totalScore = useMemo(() => {
    const v = value;
    return (
      Number(v.evidenceQuality || 0) +
      Number(v.severity || 0) +
      Number(v.willingnessToPay || 0) +
      Number(v.feasibility || 0) +
      Number(v.differentiation || 0)
    );
  }, [value]);

  const rationalePreview = useMemo(() => trimPreview(value.rationale || "", 240), [value.rationale]);

  function onPopulateFrom14() {
    setPopulateMsg14("");
    setCopyMsg14("");

    if (!foundMeaningfulStep14(s14)) {
      setPopulateMsg14("Nothing meaningful in Step 1.4 yet. Fill it in first, then populate.");
      return;
    }

    const snap = buildStep14SnapshotText(s14);

    setValue({
      ...value,
      autoEvidence: { ...value.autoEvidence, step14: snap },
      artifactsChecklist: {
        ...value.artifactsChecklist,
        step14_metrics: true,
      },
    });

    setPopulateMsg14("Snapshot populated.");
  }

  function onPopulateFrom16() {
    setPopulateMsg16("");
    setCopyMsg16("");

    if (!foundMeaningfulStep16(s16)) {
      setPopulateMsg16("Nothing meaningful in Step 1.6 yet. Add sessions, then populate.");
      return;
    }

    const snap = buildStep16SnapshotText(s16);

    setValue({
      ...value,
      autoEvidence: { ...value.autoEvidence, step16: snap },
      artifactsChecklist: {
        ...value.artifactsChecklist,
        step16_evidencePlanOrLog: true,
      },
    });

    setPopulateMsg16("Snapshot populated.");
  }

  async function onCopy14() {
    setCopyMsg14("");
    const ok = await copyTextToClipboard(value.autoEvidence?.step14 ?? "");
    setCopyMsg14(ok ? "Copied" : "Copy failed");
  }

  async function onCopy16() {
    setCopyMsg16("");
    const ok = await copyTextToClipboard(value.autoEvidence?.step16 ?? "");
    setCopyMsg16(ok ? "Copied" : "Copy failed");
  }

  function onClear14() {
    setValue({ ...value, autoEvidence: { ...value.autoEvidence, step14: "" } });
    setPopulateMsg14("");
    setCopyMsg14("");
  }

  function onClear16() {
    setValue({ ...value, autoEvidence: { ...value.autoEvidence, step16: "" } });
    setPopulateMsg16("");
    setCopyMsg16("");
  }

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const has14 = Boolean((value.autoEvidence?.step14 || "").trim());
  const has16 = Boolean((value.autoEvidence?.step16 || "").trim());

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.10: Gate Review"
      subtitle="Make the decision. Use snapshots from 1.4 and 1.6 as evidence, without dumping weird garbage into your rationale."
      dossierId={dossierId}
      dossierName={dossier.meta?.projectName}
      saveMsg={saveMsg}
    >
      <DecisionBanner decision={value.decision} totalScore={totalScore} rationalePreview={rationalePreview} has14={has14} has16={has16} s16={s16} />

      <StepHelp title="How to use this">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Populate snapshots, then write a rationale that references them. If you can’t cite evidence, you’re guessing.
          </div>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>Populate Step 1.4 snapshot once metrics are real.</li>
            <li>Populate Step 1.6 snapshot once sessions exist.</li>
            <li>Rationale stays human-written.</li>
          </ul>
        </div>
      </StepHelp>

      {/* Step 1.4 */}
      <Card>
        <div style={cardHeaderRow}>
          <h3 style={h3}>Evidence snapshot from Step 1.4</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={step14Href} style={linkStyle}>
              Open 1.4 →
            </Link>
            <button type="button" style={btnSmallStyle} onClick={onPopulateFrom14}>
              Populate from 1.4
            </button>
          </div>
        </div>

        {populateMsg14 ? <div style={msgLine}>{populateMsg14}</div> : null}

        {value.autoEvidence?.step14 ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={miniBtnStyle} onClick={onCopy14}>
                Copy
              </button>
              <button type="button" style={miniBtnStyle} onClick={onClear14}>
                Clear
              </button>
              {copyMsg14 ? <span style={copyMsgStyle}>{copyMsg14}</span> : null}
            </div>
            <pre style={snapshotStyle}>{value.autoEvidence.step14}</pre>
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
            No snapshot saved yet. Populate when Step 1.4 contains real data.
          </div>
        )}
      </Card>

      {/* Step 1.6 */}
      <Card>
        <div style={cardHeaderRow}>
          <h3 style={h3}>Evidence snapshot from Step 1.6</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={step16Href} style={linkStyle}>
              Open 1.6 →
            </Link>
            <button type="button" style={btnSmallStyle} onClick={onPopulateFrom16}>
              Populate from 1.6
            </button>
          </div>
        </div>

        {populateMsg16 ? <div style={msgLine}>{populateMsg16}</div> : null}

        {value.autoEvidence?.step16 ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={miniBtnStyle} onClick={onCopy16}>
                Copy
              </button>
              <button type="button" style={miniBtnStyle} onClick={onClear16}>
                Clear
              </button>
              {copyMsg16 ? <span style={copyMsgStyle}>{copyMsg16}</span> : null}
            </div>
            <pre style={snapshotStyle}>{value.autoEvidence.step16}</pre>
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
            No snapshot saved yet. Populate when Step 1.6 has sessions logged.
          </div>
        )}
      </Card>

      {/* Gate Review inputs */}
      <Card>
        <h3 style={h3}>Gate decision</h3>

        <Select
          label="Decision"
          value={value.decision}
          onChange={(v) => setValue({ ...value, decision: v as GateDecision })}
          options={[
            { value: "go", label: "Go" },
            { value: "one-iteration", label: "One-iteration" },
            { value: "stop", label: "Stop" },
          ]}
        />

        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
          <strong>Score (0–10 each):</strong> total {totalScore}/50
        </div>

        <div style={scoreGridStyle}>
          <ScoreSelect label="Evidence quality" value={value.evidenceQuality} onChange={(n) => setValue({ ...value, evidenceQuality: n })} />
          <ScoreSelect label="Severity" value={value.severity} onChange={(n) => setValue({ ...value, severity: n })} />
          <ScoreSelect label="Willingness to pay" value={value.willingnessToPay} onChange={(n) => setValue({ ...value, willingnessToPay: n })} />
          <ScoreSelect label="Feasibility" value={value.feasibility} onChange={(n) => setValue({ ...value, feasibility: n })} />
          <ScoreSelect label="Differentiation" value={value.differentiation} onChange={(n) => setValue({ ...value, differentiation: n })} />
        </div>

        <h4 style={h4}>Artifacts checklist</h4>
        <div style={{ display: "grid", gap: 8 }}>
          {Object.entries(value.artifactsChecklist).map(([k, checked]) => (
            <CheckboxRow
              key={k}
              label={ARTIFACT_LABELS[k] ?? prettifyArtifactKey(k)}
              checked={!!checked}
              onChange={(b) => setValue({ ...value, artifactsChecklist: { ...value.artifactsChecklist, [k]: b } })}
            />
          ))}
        </div>

        <Area
          label="Rationale (cite evidence)"
          value={value.rationale}
          onChange={(v) => setValue({ ...value, rationale: v })}
          placeholder={
            "Write like a reviewer is going to challenge you.\n" +
            "Reference the snapshots above.\n\n" +
            "- What evidence supports this?\n" +
            "- What evidence weakens it?\n" +
            "- Why Go / One-iteration / Stop is justified?"
          }
          minH={180}
        />

        <Area
          label="Next actions (concrete)"
          value={value.nextActions}
          onChange={(v) => setValue({ ...value, nextActions: v })}
          placeholder={
            "If Go:\n- Build/test ___ by ___\n\n" +
            "If One-iteration:\n- Test assumption ___ with ___ participants by ___\n- If threshold not met, Stop.\n\n" +
            "If Stop:\n- Capture learning and park the dossier."
          }
          minH={140}
        />
      </Card>
    </StepShell>
  );
}

/* ---------- UI bits ---------- */

function Loading() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <p>Loading…</p>
    </main>
  );
}

function NoDossier() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <p>
        No active dossier found. Go to <Link href="/intake">/intake</Link>.
      </p>
    </main>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16, marginTop: 14 }}>{children}</div>;
}

function Select(props: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 700, display: "block" }}>{props.label}</label>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)} style={selectStyle}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScoreSelect(props: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 800, display: "block", fontSize: 12, opacity: 0.9 }}>{props.label}</label>
      <select value={String(props.value ?? 0)} onChange={(e) => props.onChange(parseInt(e.target.value, 10))} style={selectStyle}>
        {Array.from({ length: 11 }).map((_, i) => (
          <option key={i} value={String(i)}>
            {i}
          </option>
        ))}
      </select>
    </div>
  );
}

function Area(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; minH?: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 700, display: "block" }}>{props.label}</label>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={textareaStyle(props.minH ?? 110)}
      />
    </div>
  );
}

function CheckboxRow(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
      <span style={{ fontSize: 13, opacity: 0.9 }}>{props.label}</span>
    </label>
  );
}

/* ---------- styles ---------- */

const bannerStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 16,
  marginTop: 6,
};

const h3: CSSProperties = { marginTop: 0, marginBottom: 10, fontSize: 16, fontWeight: 800 };
const h4: CSSProperties = { marginTop: 14, marginBottom: 8, fontSize: 14, fontWeight: 900, opacity: 0.9 };

const cardHeaderRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "baseline",
};

const msgLine: CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  opacity: 0.75,
};

const copyMsgStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
  alignSelf: "center",
};

const snapshotStyle: CSSProperties = {
  marginTop: 10,
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
  whiteSpace: "pre-wrap",
  fontSize: 12,
  lineHeight: 1.5,
  overflowX: "auto",
};

const linkStyle: CSSProperties = {
  textDecoration: "none",
  fontWeight: 800,
};

const btnSmallStyle: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
};

const miniBtnStyle: CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ccc",
  borderRadius: 10,
  fontWeight: 800,
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
};

const scoreGridStyle: CSSProperties = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(140px, 1fr))",
  gap: 12,
};

const selectStyle: CSSProperties = {
  marginTop: 8,
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: 12,
  fontFamily: "system-ui",
  background: "transparent",
  color: "inherit",
  boxSizing: "border-box",
};

function textareaStyle(minHeight: number): CSSProperties {
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
