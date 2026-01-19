// src/app/steps/1-10/page.tsx
"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";
import type { Dossier } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";

const STEP_ID = "1-10";

// Keep these aligned with Step 1.6’s “soft checklist”
const MIN_QUOTES = 10;
const MIN_BASELINE_SIGNALS = 2;

type GateDecision = "go" | "one-iteration" | "stop";

type Step110Payload = {
  decision: GateDecision;

  // 0–10
  evidenceQuality: number;
  severity: number;
  willingnessToPay: number;
  feasibility: number;
  differentiation: number;

  artifactsChecklist: Record<string, boolean>;

  rationale: string;
  nextActions: string;

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
};

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
  if (isObject(raw) && isObject((raw as any).value) && typeof (raw as any).value.updatedAt === "string") return (raw as any).value.updatedAt;
  return null;
}

function firstIntFromString(s: string): number | null {
  const m = (s || "").match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

/* ---------- Auto-block helpers (idempotent) ---------- */

type AutoTag = "step14" | "step16";

function upsertAutoBlock(base: string, tag: AutoTag, content: string): string {
  const start = `\n[Auto:${tag}:START]\n`;
  const end = `\n[Auto:${tag}:END]\n`;
  const block = `${start}${content.trim()}\n${end}`;

  const current = (base ?? "").trimEnd();
  const re = new RegExp(`\\n\\[Auto:${tag}:START\\][\\s\\S]*?\\n\\[Auto:${tag}:END\\]\\n?`, "m");

  if (!current) return block.trim() + "\n";

  if (re.test(current)) {
    return current.replace(re, "\n" + block + "\n").trimEnd() + "\n";
  }

  return current + "\n\n" + block + "\n";
}

/* ---------- Step 1.4 summary extraction ---------- */

type MetricSummary = {
  name: string;
  baseline: string;
  target: string;
  howMeasured: string;
  window: string;
  definition?: string;
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
  return {
    name: String(obj.name ?? "").trim(),
    baseline: String(obj.baseline ?? "").trim(),
    target: String(obj.target ?? "").trim(),
    howMeasured: String(obj.howMeasured ?? obj.method ?? "").trim(),
    window: String(obj.window ?? obj.frequency ?? "").trim(),
    definition: String(obj.definition ?? "").trim() || undefined,
  };
}

function extractStep14Summary(dossier: Dossier | null): Step14Summary {
  const v = getStepValue(dossier, "1-4");
  const updatedAt = getStepUpdatedAt(dossier, "1-4");

  if (!v) {
    return { ok: false, metrics: [], guardrails: "", measurementPlan: "", updatedAt, note: "Step 1.4 is empty." };
  }

  if (!isObject(v)) {
    return { ok: false, metrics: [], guardrails: "", measurementPlan: "", updatedAt, note: "Step 1.4 is not an object payload." };
  }

  const m1 = (v as any).leadMetric1 ?? null;
  const m2 = (v as any).leadMetric2 ?? null;

  const metrics: MetricSummary[] = [];
  if (m1) metrics.push(normalizeMetric(m1));
  if (m2) metrics.push(normalizeMetric(m2));

  const guardrails = String((v as any).guardrails ?? "").trim();
  const measurementPlan = String((v as any).measurementPlan ?? (v as any).plan ?? "").trim();

  const ok =
    metrics.some((m) => m.name || m.baseline || m.target || m.howMeasured || m.window) ||
    !!guardrails ||
    !!measurementPlan;

  return { ok, metrics, guardrails, measurementPlan, updatedAt };
}

function buildStep14SnapshotText(s14: Step14Summary): string {
  const lines: string[] = [];
  lines.push("Step 1.4 Snapshot (auto)");
  if (s14.updatedAt) lines.push(`Last updated: ${formatDateTime(s14.updatedAt)}`);
  lines.push("");

  const ms = s14.metrics.length ? s14.metrics : [];
  if (ms.length === 0) {
    lines.push("No lead metrics found.");
  } else {
    ms.forEach((m, idx) => {
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

/* ---------- Step 1.6 summary extraction ---------- */

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
    const consentScript = isObject((v as any).consent) ? String((v as any).consent.scriptOrNotes ?? "") : "";
    const ok = Boolean(consentScript.trim()) || Boolean(String((v as any).targetParticipants ?? "").trim());
    return {
      ...empty,
      ok,
      version,
      note: "Step 1.6 isn’t on v2, so session summary is unavailable. (Open Step 1.6 once to migrate.)",
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
    String((v as any).targetParticipants ?? "").trim().length > 0 ||
    String((v as any).decisionRule ?? "").trim().length > 0;

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
  lines.push("Step 1.6 Snapshot (auto)");
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
  lines.push(`- Baseline signals (target ≥ ${MIN_BASELINE_SIGNALS}): ${s16.evidencePack.passBaselineSignals ? "PASS" : "FAIL"}`);
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

/* ---------- Page ---------- */

export default function Step110Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step110Payload>(STEP_ID, DEFAULT_PAYLOAD);

  const s14 = useMemo(() => extractStep14Summary(dossier ?? null), [dossier]);
  const s16 = useMemo(() => extractStep16Summary(dossier ?? null), [dossier]);

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

  function onPopulateFrom14() {
    const snap = buildStep14SnapshotText(s14);
    setValue({
      ...value,
      rationale: upsertAutoBlock(value.rationale ?? "", "step14", snap),
      artifactsChecklist: {
        ...value.artifactsChecklist,
        step14_metrics: value.artifactsChecklist.step14_metrics || Boolean(s14.ok),
      },
    });
  }

  function onPopulateFrom16() {
    const snap = buildStep16SnapshotText(s16);
    setValue({
      ...value,
      rationale: upsertAutoBlock(value.rationale ?? "", "step16", snap),
      artifactsChecklist: {
        ...value.artifactsChecklist,
        step16_evidencePlanOrLog: value.artifactsChecklist.step16_evidencePlanOrLog || Boolean(s16.ok),
      },
    });
  }

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.10: Gate Review"
      subtitle="Make the decision. This page pulls evidence from 1.4 and 1.6 so you don’t retype your own work."
      dossierId={dossierId}
      dossierName={dossier.meta?.projectName}
      saveMsg={saveMsg}
    >
      <StepHelp title="How to use this">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Apply a rule to evidence. If you can’t cite counts/quotes/artifacts, you’re writing fan fiction.
          </div>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>Use the Populate buttons to drop a clean evidence snapshot into your rationale.</li>
            <li>Then write a decision that references that snapshot.</li>
            <li>One-iteration should be ≤2 days. More than 2 loops = Stop.</li>
          </ul>
        </div>
      </StepHelp>

      {/* Pulled from Step 1.4 */}
      <Card>
        <div style={cardHeaderRow}>
          <h3 style={h3}>Pulled from Step 1.4 (Measurable Indicators)</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={step14Href} style={linkStyle}>
              Open 1.4 →
            </Link>
            <button type="button" style={btnSmallStyle} onClick={onPopulateFrom14}>
              Populate from 1.4
            </button>
          </div>
        </div>

        {s14.updatedAt ? <div style={metaLine}>Last updated: {formatDateTime(s14.updatedAt)}</div> : null}

        {!s14.ok ? (
          <div style={warnText}>⚠ {s14.note ?? "No usable Step 1.4 data found."}</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 10 }}>
              {(s14.metrics.length ? s14.metrics : [{ name: "", baseline: "", target: "", howMeasured: "", window: "" }]).map((m, idx) => (
                <div key={idx} style={panelStyle}>
                  <div style={{ fontWeight: 900 }}>Lead metric {idx + 1}</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, opacity: 0.9 }}>
                    <div><strong>Name:</strong> {m.name || <span style={{ opacity: 0.6 }}>—</span>}</div>
                    {m.definition ? <div><strong>Definition:</strong> {m.definition}</div> : null}
                    <div><strong>Baseline:</strong> {m.baseline || <span style={{ opacity: 0.6 }}>—</span>}</div>
                    <div><strong>Target:</strong> {m.target || <span style={{ opacity: 0.6 }}>—</span>}</div>
                    <div><strong>How measured:</strong> {m.howMeasured || <span style={{ opacity: 0.6 }}>—</span>}</div>
                    <div><strong>Window / frequency:</strong> {m.window || <span style={{ opacity: 0.6 }}>—</span>}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={panelStyle}>
              <div style={{ fontWeight: 900 }}>Guardrails</div>
              <div style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 13, opacity: 0.9 }}>
                {s14.guardrails || "—"}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={{ fontWeight: 900 }}>Measurement plan</div>
              <div style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 13, opacity: 0.9 }}>
                {s14.measurementPlan || "—"}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Pulled from Step 1.6 */}
      <Card>
        <div style={cardHeaderRow}>
          <h3 style={h3}>Pulled from Step 1.6 (Evidence Summary)</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={step16Href} style={linkStyle}>
              Open 1.6 →
            </Link>
            <button type="button" style={btnSmallStyle} onClick={onPopulateFrom16}>
              Populate from 1.6
            </button>
          </div>
        </div>

        {s16.updatedAt ? (
          <div style={metaLine}>
            Last updated: {formatDateTime(s16.updatedAt)} · Payload: <code>{s16.version}</code>
          </div>
        ) : null}

        {!s16.ok ? (
          <div style={warnText}>⚠ {s16.note ?? "No usable Step 1.6 data found."}</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={panelStyle}>
              <div style={{ fontWeight: 900 }}>Counts</div>
              <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, opacity: 0.9 }}>
                <div>
                  <strong>Sessions:</strong> {s16.totalSessions} (Interview {s16.byKind.interview}, Observation {s16.byKind.observation}, Artifact {s16.byKind.artifact})
                </div>
                <div>
                  <strong>Mapped:</strong> {Math.max(0, s16.totalSessions - s16.unmappedCount)}/{s16.totalSessions} ({s16.mappedPct}%)
                </div>
                <div><strong>Unmapped sessions:</strong> {s16.unmappedCount}</div>
                <div><strong>Avg severity:</strong> {s16.avgSeverity}</div>
                <div><strong>Quotes captured:</strong> {s16.totalQuotes}</div>
                <div><strong>Baseline signals:</strong> {s16.baselineSignalCount}/{s16.totalSessions}</div>
                <div><strong>Workarounds captured:</strong> {s16.workaroundCount}/{s16.totalSessions}</div>
              </div>
            </div>

            <div style={panelStyle}>
              <div style={{ fontWeight: 900 }}>Evidence pack checklist (soft)</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <ChecklistLine label={`Sessions (target ≥ ${s16.evidencePack.targetN})`} ok={s16.evidencePack.passSessions} />
                <ChecklistLine label={`Quotes (target ≥ ${MIN_QUOTES})`} ok={s16.evidencePack.passQuotes} />
                <ChecklistLine label="At least 1 workaround captured" ok={s16.evidencePack.passWorkaround} />
                <ChecklistLine label={`Baseline signals (target ≥ ${MIN_BASELINE_SIGNALS})`} ok={s16.evidencePack.passBaselineSignals} />
                <ChecklistLine label="Consent addressed" ok={s16.evidencePack.passConsent} />
                {s16.evidencePack.identifiableInfoStored ? (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                    ⚠ Identifiable info stored is marked TRUE. Make sure this is intentional and justified.
                  </div>
                ) : null}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={{ fontWeight: 900 }}>Metric mapping counts</div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
                <div>leadMetric1: {s16.metricCounts["leadMetric1"] ?? 0}</div>
                <div>leadMetric2: {s16.metricCounts["leadMetric2"] ?? 0}</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                These keys match the mapping checkboxes in Step 1.6 (pulled from Step 1.4).
              </div>
            </div>

            <div style={panelStyle}>
              <div style={{ fontWeight: 900 }}>Top pains (by frequency)</div>
              {s16.topPains.length === 0 ? (
                <div style={{ marginTop: 8, opacity: 0.7 }}>—</div>
              ) : (
                <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                  {s16.topPains.map(([p, n]) => (
                    <li key={p} style={{ fontSize: 13, opacity: 0.9 }}>
                      {p} ({n})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* The actual Gate Review inputs */}
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
              label={k.replace(/_/g, " ")}
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
            "Use the Populate buttons above, then write the decision like a reviewer will challenge you.\n" +
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
      <select
        value={String(props.value ?? 0)}
        onChange={(e) => props.onChange(parseInt(e.target.value, 10))}
        style={selectStyle}
      >
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

function ChecklistLine(props: { label: string; ok: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, opacity: 0.9 }}>
      <span style={{ fontWeight: 900 }}>{props.ok ? "✅" : "⬜"}</span>
      <span>{props.label}</span>
    </div>
  );
}

/* ---------- styles ---------- */

const h3: CSSProperties = { marginTop: 0, marginBottom: 10, fontSize: 16, fontWeight: 800 };
const h4: CSSProperties = { marginTop: 14, marginBottom: 8, fontSize: 14, fontWeight: 900, opacity: 0.9 };

const cardHeaderRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "baseline",
};

const panelStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
};

const metaLine: CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  opacity: 0.7,
};

const warnText: CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  opacity: 0.9,
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
