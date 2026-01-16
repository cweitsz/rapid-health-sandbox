"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";
import type { Dossier } from "@/lib/dossier";

type Method = "interviews" | "observation" | "mixed";
type EvidenceKind = "interview" | "observation" | "artifact";
type HypothesisOutcome = "supports" | "weakens" | "disconfirms" | "unclear";

type SamplingBox = {
  primarySegment: string;
  inclusionCriteria: string;
  exclusionCriteria: string;
  recruitmentChannel: string;
  sampleTarget: string;
  whyEnough: string;
  mixRequirement: string;
  stopRule: string;
  notes: string; // migration / extra
};

type ConsentPrivacy = {
  consentObtained: boolean;
  identifiableInfoStored: boolean;
  storageAccessNotes: string;
  retentionNotes: string;
  scriptOrNotes: string;
};

type EvidenceSession = {
  id: string;
  kind: EvidenceKind;
  date: string; // ISO date or free text
  role: string;
  setting: string;
  experienceLevel: string;
  context: string;

  quote1: string;
  quote2: string;
  quote3: string;

  pain1: string;
  pain2: string;
  pain3: string;

  workaround: string;
  timeCostEstimate: string;
  severity010: number;

  // Wiring to Step 1.4:
  mappedMetrics: string[]; // keys of metric options from 1.4

  baselineSignal: string;

  // Optional wiring to Step 1.5 if present:
  hypothesisTested: string;
  hypothesisOutcome: HypothesisOutcome;

  extraNotes: string;
};

type Step16PayloadV2 = {
  version: "1.6-v2";
  method: Method;
  targetParticipants: string;

  sampling: SamplingBox;
  protocol: string;

  consent: ConsentPrivacy;
  schedulePlan: string;

  dataCapturePlan: string;
  decisionRule: string;

  sessions: EvidenceSession[];

  updatedAt?: string;
};

const STEP_ID = "1-6";

const DEFAULT_SAMPLING: SamplingBox = {
  primarySegment: "",
  inclusionCriteria: "",
  exclusionCriteria: "",
  recruitmentChannel: "",
  sampleTarget: "",
  whyEnough: "",
  mixRequirement: "",
  stopRule: "",
  notes: "",
};

const DEFAULT_CONSENT: ConsentPrivacy = {
  consentObtained: false,
  identifiableInfoStored: false,
  storageAccessNotes: "",
  retentionNotes: "",
  scriptOrNotes: "",
};

const DEFAULT_SESSION: EvidenceSession = {
  id: "",
  kind: "interview",
  date: "",
  role: "",
  setting: "",
  experienceLevel: "",
  context: "",

  quote1: "",
  quote2: "",
  quote3: "",

  pain1: "",
  pain2: "",
  pain3: "",

  workaround: "",
  timeCostEstimate: "",
  severity010: 0,

  mappedMetrics: [],
  baselineSignal: "",

  hypothesisTested: "",
  hypothesisOutcome: "unclear",

  extraNotes: "",
};

const DEFAULT_PAYLOAD: Step16PayloadV2 = {
  version: "1.6-v2",
  method: "mixed",
  targetParticipants: "",
  sampling: { ...DEFAULT_SAMPLING },
  protocol: "",
  consent: { ...DEFAULT_CONSENT },
  schedulePlan: "",
  dataCapturePlan: "",
  decisionRule: "",
  sessions: [],
};

function isObject(x: unknown): x is Record<string, any> {
  return typeof x === "object" && x !== null;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Pull the two lead metric options out of Step 1.4 payload.
 * Works with your 1.4-v2 payload shape. If missing/unknown, returns empty list.
 */
function extractMetricsFromStep14(dossier: Dossier | null): Array<{ key: string; label: string; hint?: string }> {
  if (!dossier) return [];
  const raw = (dossier.steps as any)?.["1-4"];
  if (!raw) return [];

  // unwrap { value, updatedAt } if used in storage
  let val: any = raw;
  if (isObject(val) && "value" in val && "updatedAt" in val) val = (val as any).value;

  if (!isObject(val)) return [];

  // v2: { version: "1.4-v2", leadMetric1, leadMetric2 }
  const m1 = val.leadMetric1 ?? null;
  const m2 = val.leadMetric2 ?? null;

  const out: Array<{ key: string; label: string; hint?: string }> = [];

  if (m1 && isObject(m1)) {
    const name = String(m1.name ?? "").trim();
    const def = String(m1.definition ?? "").trim();
    out.push({
      key: "leadMetric1",
      label: name ? name : "Lead metric 1 (name missing)",
      hint: def ? def : undefined,
    });
  }

  if (m2 && isObject(m2)) {
    const name = String(m2.name ?? "").trim();
    const def = String(m2.definition ?? "").trim();
    out.push({
      key: "leadMetric2",
      label: name ? name : "Lead metric 2 (name missing)",
      hint: def ? def : undefined,
    });
  }

  return out;
}

/**
 * Best-effort extraction of hypotheses from Step 1.5 without assuming a specific schema.
 * If it's a string, split by lines. If it's an array, string-ify items.
 */
function extractHypothesesFromStep15(dossier: Dossier | null): string[] {
  if (!dossier) return [];
  const raw = (dossier.steps as any)?.["1-5"];
  if (!raw) return [];

  let val: any = raw;
  if (isObject(val) && "value" in val && "updatedAt" in val) val = (val as any).value;

  // If Step 1.5 is stored as a string blob
  if (typeof val === "string") {
    return val
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  if (!isObject(val)) return [];

  // Common-ish shapes
  const candidates: any[] = [];

  if (Array.isArray(val.hypotheses)) candidates.push(...val.hypotheses);
  if (Array.isArray(val.items)) candidates.push(...val.items);
  if (typeof val.hypotheses === "string") candidates.push(val.hypotheses);
  if (typeof val.disconfirmingHypotheses === "string") candidates.push(val.disconfirmingHypotheses);

  const flattened: string[] = [];
  for (const c of candidates) {
    if (typeof c === "string") {
      flattened.push(...c.split("\n").map((s) => s.trim()).filter(Boolean));
    } else if (isObject(c)) {
      const t = String(c.text ?? c.title ?? "").trim();
      if (t) flattened.push(t);
    } else if (c != null) {
      const t = String(c).trim();
      if (t) flattened.push(t);
    }
  }

  // de-dupe
  return Array.from(new Set(flattened)).slice(0, 20);
}

/**
 * Migrate v0.1 Step 1.6 payload (your current state) into v2.
 */
function migrateToV2(raw: any): Step16PayloadV2 {
  if (isObject(raw) && raw.version === "1.6-v2") {
    // normalize minimal defaults
    return {
      version: "1.6-v2",
      method: (raw.method === "interviews" || raw.method === "observation" || raw.method === "mixed") ? raw.method : "mixed",
      targetParticipants: String(raw.targetParticipants ?? ""),
      sampling: {
        ...DEFAULT_SAMPLING,
        ...(isObject(raw.sampling) ? {
          primarySegment: String(raw.sampling.primarySegment ?? ""),
          inclusionCriteria: String(raw.sampling.inclusionCriteria ?? ""),
          exclusionCriteria: String(raw.sampling.exclusionCriteria ?? ""),
          recruitmentChannel: String(raw.sampling.recruitmentChannel ?? ""),
          sampleTarget: String(raw.sampling.sampleTarget ?? ""),
          whyEnough: String(raw.sampling.whyEnough ?? ""),
          mixRequirement: String(raw.sampling.mixRequirement ?? ""),
          stopRule: String(raw.sampling.stopRule ?? ""),
          notes: String(raw.sampling.notes ?? ""),
        } : {}),
      },
      protocol: String(raw.protocol ?? ""),
      consent: {
        ...DEFAULT_CONSENT,
        ...(isObject(raw.consent) ? {
          consentObtained: Boolean(raw.consent.consentObtained ?? false),
          identifiableInfoStored: Boolean(raw.consent.identifiableInfoStored ?? false),
          storageAccessNotes: String(raw.consent.storageAccessNotes ?? ""),
          retentionNotes: String(raw.consent.retentionNotes ?? ""),
          scriptOrNotes: String(raw.consent.scriptOrNotes ?? ""),
        } : {}),
      },
      schedulePlan: String(raw.schedulePlan ?? ""),
      dataCapturePlan: String(raw.dataCapturePlan ?? ""),
      decisionRule: String(raw.decisionRule ?? ""),
      sessions: Array.isArray(raw.sessions)
        ? raw.sessions
            .filter(isObject)
            .map((s: any) => ({
              ...DEFAULT_SESSION,
              id: String(s.id ?? makeId()),
              kind: (s.kind === "interview" || s.kind === "observation" || s.kind === "artifact") ? s.kind : "interview",
              date: String(s.date ?? ""),
              role: String(s.role ?? ""),
              setting: String(s.setting ?? ""),
              experienceLevel: String(s.experienceLevel ?? ""),
              context: String(s.context ?? ""),
              quote1: String(s.quote1 ?? ""),
              quote2: String(s.quote2 ?? ""),
              quote3: String(s.quote3 ?? ""),
              pain1: String(s.pain1 ?? ""),
              pain2: String(s.pain2 ?? ""),
              pain3: String(s.pain3 ?? ""),
              workaround: String(s.workaround ?? ""),
              timeCostEstimate: String(s.timeCostEstimate ?? ""),
              severity010: Math.max(0, Math.min(10, Number(s.severity010 ?? 0))),
              mappedMetrics: Array.isArray(s.mappedMetrics) ? s.mappedMetrics.map(String) : [],
              baselineSignal: String(s.baselineSignal ?? ""),
              hypothesisTested: String(s.hypothesisTested ?? ""),
              hypothesisOutcome: (s.hypothesisOutcome === "supports" || s.hypothesisOutcome === "weakens" || s.hypothesisOutcome === "disconfirms" || s.hypothesisOutcome === "unclear")
                ? s.hypothesisOutcome
                : "unclear",
              extraNotes: String(s.extraNotes ?? ""),
            }))
        : [],
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    };
  }

  // v0.1 shape (your current Step16Payload)
  const method: Method =
    raw?.method === "interviews" || raw?.method === "observation" || raw?.method === "mixed" ? raw.method : "mixed";

  return {
    version: "1.6-v2",
    method,
    targetParticipants: String(raw?.targetParticipants ?? ""),
    sampling: {
      ...DEFAULT_SAMPLING,
      notes: String(raw?.samplingBox ?? ""),
    },
    protocol: String(raw?.scriptOrProtocol ?? ""),
    consent: {
      ...DEFAULT_CONSENT,
      scriptOrNotes: String(raw?.consentPrivacyNotes ?? ""),
    },
    schedulePlan: String(raw?.schedulePlan ?? ""),
    dataCapturePlan: String(raw?.dataCapturePlan ?? ""),
    decisionRule: String(raw?.whatCountsAsPassFail ?? ""),
    sessions: [],
  };
}

export default function Step16Page() {
  // Store whatever comes out, then normalize
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<any>(STEP_ID, DEFAULT_PAYLOAD);

  const didMigrateRef = useRef(false);

  useEffect(() => {
    if (!isReady) return;
    if (!dossierId || !dossier) return;
    if (didMigrateRef.current) return;

    const needsMigration = !isObject(value) || value.version !== "1.6-v2";
    if (needsMigration) {
      didMigrateRef.current = true;
      setValue(migrateToV2(value));
      return;
    }

    // normalize missing nested bits
    didMigrateRef.current = true;
    setValue(migrateToV2(value));
  }, [isReady, dossierId, dossier, value, setValue]);

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const v2: Step16PayloadV2 = migrateToV2(value);

  const metricOptions = useMemo(() => extractMetricsFromStep14(dossier), [dossier]);
  const hypothesisOptions = useMemo(() => extractHypothesesFromStep15(dossier), [dossier]);

  const counts = useMemo(() => {
    const sessions = v2.sessions ?? [];
    const byKind: Record<EvidenceKind, number> = { interview: 0, observation: 0, artifact: 0 };
    let sevSum = 0;
    let sevN = 0;

    const metricCounts: Record<string, number> = {};
    const painCounts: Record<string, number> = {};

    for (const s of sessions) {
      byKind[s.kind] = (byKind[s.kind] ?? 0) + 1;
      if (typeof s.severity010 === "number") {
        sevSum += s.severity010;
        sevN += 1;
      }

      for (const mk of (s.mappedMetrics ?? [])) {
        metricCounts[mk] = (metricCounts[mk] ?? 0) + 1;
      }

      const pains = [s.pain1, s.pain2, s.pain3]
        .map((p) => (p || "").trim())
        .filter(Boolean)
        .map((p) => p.toLowerCase());

      for (const p of pains) {
        painCounts[p] = (painCounts[p] ?? 0) + 1;
      }
    }

    const topPains = Object.entries(painCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const avgSeverity = sevN ? Math.round((sevSum / sevN) * 10) / 10 : 0;

    return { total: sessions.length, byKind, metricCounts, topPains, avgSeverity };
  }, [v2.sessions]);

  function setPlanPatch(patch: Partial<Step16PayloadV2>) {
    setValue({ ...v2, ...patch });
  }

  function updateSession(sessionId: string, patch: Partial<EvidenceSession>) {
    const next = (v2.sessions ?? []).map((s) => (s.id === sessionId ? { ...s, ...patch } : s));
    setValue({ ...v2, sessions: next });
  }

  function addSession(kind: EvidenceKind) {
    const id = makeId();
    const next: EvidenceSession = {
      ...DEFAULT_SESSION,
      id,
      kind,
      date: new Date().toISOString().slice(0, 10),
      severity010: 0,
      mappedMetrics: [],
      hypothesisOutcome: "unclear",
    };
    setValue({ ...v2, sessions: [...(v2.sessions ?? []), next] });
  }

  function removeSession(sessionId: string) {
    const next = (v2.sessions ?? []).filter((s) => s.id !== sessionId);
    setValue({ ...v2, sessions: next });
  }

  const missingMetrics = metricOptions.length === 0;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.6: Problem Validation Interviews/Observation"
      subtitle="Collect evidence that maps to your Step 1.4 lead metrics. No metrics = no trustworthy evidence."
      dossierId={dossierId}
      dossierName={dossier.meta?.projectName}
      saveMsg={saveMsg}
    >
      <StepHelp title="How to fill this in">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            This step produces an evidence pack a reviewer can trust: <strong>who</strong>, <strong>what</strong>, and
            <strong> how</strong> you’ll decide. Most importantly: every session should map back to the metrics in Step 1.4.
          </div>

          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li><strong>Sampling box:</strong> inclusion/exclusion, channel, target, stop rule.</li>
            <li><strong>Session logs:</strong> 3 quotes, 3 pains, workaround, time/cost, severity, mapped metrics.</li>
            <li><strong>Counts summary:</strong> turns your “insights” into something measurable.</li>
          </ul>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Hard rule:</strong> If Step 1.4 is empty, you’re just collecting stories.
          </div>
        </div>
      </StepHelp>

      {/* Wire-in panel */}
      <Card>
        <h3 style={h3}>Wiring: Metrics from Step 1.4</h3>

        {missingMetrics ? (
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            ⚠ No lead metrics found in Step 1.4. Go fill that in first, otherwise mapping is impossible.{" "}
            <Link href={`/steps/1-4?d=${dossierId}`} style={{ textDecoration: "underline" }}>
              Open Step 1.4 →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {metricOptions.map((m) => (
              <div key={m.key} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 900 }}>{m.label}</div>
                {m.hint ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>{m.hint}</div> : null}
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                  Mapping key: <code>{m.key}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Plan */}
      <Card>
        <h3 style={h3}>Plan</h3>

        <Select
          label="Method"
          value={v2.method}
          onChange={(x) => setPlanPatch({ method: x as Method })}
          options={[
            { value: "interviews", label: "Interviews" },
            { value: "observation", label: "Observation" },
            { value: "mixed", label: "Mixed" },
          ]}
        />

        <Area
          label="Target participants"
          value={v2.targetParticipants}
          onChange={(x) => setPlanPatch({ targetParticipants: x })}
          placeholder={
            "Roles + context + count. One line per segment.\n" +
            "- __ x (role) in (setting)\n" +
            "Example:\n" +
            "- 4 x practice managers in clinics with 3–10 clinicians\n" +
            "- 4 x admin staff who handle intake daily\n" +
            "- 2 x clinicians who receive the handoff"
          }
          minH={110}
        />

        <h4 style={h4}>Sampling box</h4>
        <div style={panelStyle}>
          <Field
            label="Primary segment"
            value={v2.sampling.primarySegment}
            onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, primarySegment: x } })}
            placeholder="e.g. Practice managers in private clinics (3–10 clinicians)"
          />
          <Area
            label="Inclusion criteria"
            value={v2.sampling.inclusionCriteria}
            onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, inclusionCriteria: x } })}
            placeholder="Must have done X in last Y days; uses system Z; volume threshold…"
            minH={80}
          />
          <Area
            label="Exclusion criteria"
            value={v2.sampling.exclusionCriteria}
            onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, exclusionCriteria: x } })}
            placeholder="Exclude edge cases that would bias results."
            minH={70}
          />
          <div style={rowStyle}>
            <Field
              label="Recruitment channel"
              value={v2.sampling.recruitmentChannel}
              onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, recruitmentChannel: x } })}
              placeholder="e.g. personal network, clinics list, student cohort, LinkedIn"
            />
            <Field
              label="Sample target"
              value={v2.sampling.sampleTarget}
              onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, sampleTarget: x } })}
              placeholder="e.g. 8–12 interviews OR 3–5 observations"
            />
          </div>
          <Area
            label="Why that’s enough (for disconfirmation)"
            value={v2.sampling.whyEnough}
            onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, whyEnough: x } })}
            placeholder="Why this sample size is enough to catch ‘we’re wrong’ quickly."
            minH={70}
          />
          <Area
            label="Mix requirement"
            value={v2.sampling.mixRequirement}
            onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, mixRequirement: x } })}
            placeholder="e.g. 50/50 small vs medium clinics, novice vs experienced, metro vs regional"
            minH={70}
          />
          <Area
            label="Stop rule"
            value={v2.sampling.stopRule}
            onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, stopRule: x } })}
            placeholder="Stop recruiting when disconfirming evidence appears OR after N."
            minH={60}
          />

          <Area
            label="Extra notes (optional)"
            value={v2.sampling.notes}
            onChange={(x) => setPlanPatch({ sampling: { ...v2.sampling, notes: x } })}
            placeholder="Anything else. If you migrated from v0.1, your old free-text sampling box may appear here."
            minH={70}
          />
        </div>

        <Area
          label="Script / protocol"
          value={v2.protocol}
          onChange={(x) => setPlanPatch({ protocol: x })}
          placeholder={
            "Link or paste your actual prompts/checkpoints.\n" +
            "1) Walk me through the last time you did ___.\n" +
            "2) Where does it break down?\n" +
            "3) What workaround do you use? Show me.\n" +
            "4) What’s the time/cost/risk?\n" +
            "5) Who else is involved? Who approves change?\n" +
            "6) What would make you switch? What would stop you?"
          }
          minH={120}
        />

        <h4 style={h4}>Consent + privacy</h4>
        <div style={panelStyle}>
          <CheckboxRow
            label="Consent obtained for interview/observation and any recording"
            checked={v2.consent.consentObtained}
            onChange={(b) => setPlanPatch({ consent: { ...v2.consent, consentObtained: b } })}
          />
          <CheckboxRow
            label="Identifiable info stored (names, patient identifiers, etc.)"
            checked={v2.consent.identifiableInfoStored}
            onChange={(b) => setPlanPatch({ consent: { ...v2.consent, identifiableInfoStored: b } })}
          />

          <Area
            label="Consent script / privacy notes"
            value={v2.consent.scriptOrNotes}
            onChange={(x) => setPlanPatch({ consent: { ...v2.consent, scriptOrNotes: x } })}
            placeholder={
              "What you will say + what you will NOT collect.\n" +
              "- Purpose: __\n" +
              "- Voluntary + can stop anytime\n" +
              "- Recording: yes/no\n" +
              "- We will NOT collect: names, DOB, addresses, identifiable patient details\n" +
              "- De-identification: how"
            }
            minH={120}
          />

          <div style={rowStyle}>
            <Area
              label="Storage + access"
              value={v2.consent.storageAccessNotes}
              onChange={(x) => setPlanPatch({ consent: { ...v2.consent, storageAccessNotes: x } })}
              placeholder="Where stored and who can access (local device, shared drive, etc.)"
              minH={80}
            />
            <Area
              label="Retention"
              value={v2.consent.retentionNotes}
              onChange={(x) => setPlanPatch({ consent: { ...v2.consent, retentionNotes: x } })}
              placeholder="How long kept, then delete"
              minH={80}
            />
          </div>
        </div>

        <Area
          label="Schedule plan"
          value={v2.schedulePlan}
          onChange={(x) => setPlanPatch({ schedulePlan: x })}
          placeholder="Recruiting steps, cadence, dates. Keep it concrete."
          minH={90}
        />

        <Area
          label="Data capture plan"
          value={v2.dataCapturePlan}
          onChange={(x) => setPlanPatch({ dataCapturePlan: x })}
          placeholder={
            "Define artifacts (so you don’t end up with vibes).\n" +
            "- Notes template headings\n" +
            "- Recording yes/no\n" +
            "- Quotes: __ per session\n" +
            "- Screenshots/photos of workaround yes/no (de-identified)\n" +
            "- Counts/timestamps to record\n" +
            "- Where stored"
          }
          minH={120}
        />

        <Area
          label="Decision rule (Go / Iterate / Stop)"
          value={v2.decisionRule}
          onChange={(x) => setPlanPatch({ decisionRule: x })}
          placeholder={
            "Write thresholds.\n" +
            "Go if:\n" +
            "- __/10 report pain weekly AND can show a workaround used in last 7 days.\n" +
            "Iterate if:\n" +
            "- Pain exists but only in ___ context OR buyer/approver differs.\n" +
            "Stop if:\n" +
            "- Fewer than __/10 report meaningful pain OR workaround is fast/cheap."
          }
          minH={140}
        />
      </Card>

      {/* Evidence */}
      <Card>
        <h3 style={h3}>Evidence log</h3>

        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Add sessions and map them to your Step 1.4 lead metrics. This is the whole point.
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={btnStyle} onClick={() => addSession("interview")}>
            + Add interview
          </button>
          <button type="button" style={btnStyle} onClick={() => addSession("observation")}>
            + Add observation
          </button>
          <button type="button" style={btnStyle} onClick={() => addSession("artifact")}>
            + Add artifact review
          </button>
        </div>

        {v2.sessions.length === 0 ? (
          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
            No sessions logged yet. Add one. Future you will thank you. Probably.
          </div>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {v2.sessions.map((s, idx) => (
              <div key={s.id} style={sessionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900 }}>
                    Session {idx + 1} · {s.kind}
                  </div>
                  <button type="button" style={miniBtnStyle} onClick={() => removeSession(s.id)}>
                    Remove
                  </button>
                </div>

                <div style={rowStyle}>
                  <Field
                    label="Date"
                    value={s.date}
                    onChange={(x) => updateSession(s.id, { date: x })}
                    placeholder="YYYY-MM-DD"
                  />
                  <Field
                    label="Role"
                    value={s.role}
                    onChange={(x) => updateSession(s.id, { role: x })}
                    placeholder="e.g. Practice manager / Student / Clinician"
                  />
                </div>

                <div style={rowStyle}>
                  <Field
                    label="Setting"
                    value={s.setting}
                    onChange={(x) => updateSession(s.id, { setting: x })}
                    placeholder="e.g. Private clinic / University lab / GP practice"
                  />
                  <Field
                    label="Experience level"
                    value={s.experienceLevel}
                    onChange={(x) => updateSession(s.id, { experienceLevel: x })}
                    placeholder="e.g. New grad / 10y / Year 2"
                  />
                </div>

                <Area
                  label="Context (what task were they doing?)"
                  value={s.context}
                  onChange={(x) => updateSession(s.id, { context: x })}
                  placeholder="What were they trying to do? Where in workflow?"
                  minH={70}
                />

                <h4 style={h4}>Verbatim quotes (max 2 lines each)</h4>
                <div style={panelStyle}>
                  <Field label="Quote 1" value={s.quote1} onChange={(x) => updateSession(s.id, { quote1: x })} />
                  <Field label="Quote 2" value={s.quote2} onChange={(x) => updateSession(s.id, { quote2: x })} />
                  <Field label="Quote 3" value={s.quote3} onChange={(x) => updateSession(s.id, { quote3: x })} />
                </div>

                <h4 style={h4}>Top pains</h4>
                <div style={panelStyle}>
                  <Field label="Pain 1" value={s.pain1} onChange={(x) => updateSession(s.id, { pain1: x })} />
                  <Field label="Pain 2" value={s.pain2} onChange={(x) => updateSession(s.id, { pain2: x })} />
                  <Field label="Pain 3" value={s.pain3} onChange={(x) => updateSession(s.id, { pain3: x })} />
                </div>

                <Area
                  label="Workaround (observed or described)"
                  value={s.workaround}
                  onChange={(x) => updateSession(s.id, { workaround: x })}
                  placeholder="What do they do instead? If observed: what proof artifact exists?"
                  minH={70}
                />

                <div style={rowStyle}>
                  <Field
                    label="Time/cost estimate"
                    value={s.timeCostEstimate}
                    onChange={(x) => updateSession(s.id, { timeCostEstimate: x })}
                    placeholder="e.g. adds 5–10 min per case, 2 reworks/week"
                  />
                  <SelectSimple
                    label="Severity (0–10)"
                    value={String(s.severity010)}
                    onChange={(x) => updateSession(s.id, { severity010: Number(x) })}
                    options={Array.from({ length: 11 }).map((_, i) => ({ value: String(i), label: String(i) }))}
                  />
                </div>

                <h4 style={h4}>Map to Step 1.4 lead metrics</h4>

                {missingMetrics ? (
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    ⚠ No metrics available. Fill Step 1.4 first.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {metricOptions.map((m) => {
                      const checked = (s.mappedMetrics ?? []).includes(m.key);
                      return (
                        <CheckboxRow
                          key={m.key}
                          label={m.label}
                          checked={checked}
                          onChange={(b) => {
                            const curr = s.mappedMetrics ?? [];
                            const next = b ? Array.from(new Set([...curr, m.key])) : curr.filter((k) => k !== m.key);
                            updateSession(s.id, { mappedMetrics: next });
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                <Field
                  label="Baseline signal you heard/saw (number or range)"
                  value={s.baselineSignal}
                  onChange={(x) => updateSession(s.id, { baselineSignal: x })}
                  placeholder="e.g. “usually 10–15 min”, “~40% incomplete”, “2 handoffs”"
                />

                <h4 style={h4}>Disconfirming hypothesis (optional wiring to 1.5)</h4>
                {hypothesisOptions.length > 0 ? (
                  <SelectSimple
                    label="Hypothesis tested"
                    value={s.hypothesisTested}
                    onChange={(x) => updateSession(s.id, { hypothesisTested: x })}
                    options={[
                      { value: "", label: "—" },
                      ...hypothesisOptions.map((h) => ({ value: h, label: h })),
                    ]}
                  />
                ) : (
                  <Field
                    label="Hypothesis tested"
                    value={s.hypothesisTested}
                    onChange={(x) => updateSession(s.id, { hypothesisTested: x })}
                    placeholder="If Step 1.5 isn’t structured yet, type it here."
                  />
                )}

                <SelectSimple
                  label="Outcome"
                  value={s.hypothesisOutcome}
                  onChange={(x) => updateSession(s.id, { hypothesisOutcome: x as HypothesisOutcome })}
                  options={[
                    { value: "unclear", label: "Unclear" },
                    { value: "supports", label: "Supports" },
                    { value: "weakens", label: "Weakens" },
                    { value: "disconfirms", label: "Disconfirms" },
                  ]}
                />

                <Area
                  label="Extra notes"
                  value={s.extraNotes}
                  onChange={(x) => updateSession(s.id, { extraNotes: x })}
                  placeholder="Anything else. Keep it short. Evidence beats essays."
                  minH={70}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card>
        <h3 style={h3}>Auto summary (counts)</h3>
        <div style={{ display: "grid", gap: 8, fontSize: 13, opacity: 0.9 }}>
          <div>
            <strong>Sessions:</strong> {counts.total} (Interview {counts.byKind.interview}, Observation {counts.byKind.observation}, Artifact {counts.byKind.artifact})
          </div>
          <div>
            <strong>Avg severity:</strong> {counts.avgSeverity}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Metric mapping counts:</strong>
            {metricOptions.length === 0 ? (
              <div style={{ marginTop: 6, opacity: 0.8 }}>—</div>
            ) : (
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {metricOptions.map((m) => (
                  <li key={m.key}>
                    {m.label}: {counts.metricCounts[m.key] ?? 0}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Top pains (by frequency):</strong>
            {counts.topPains.length === 0 ? (
              <div style={{ marginTop: 6, opacity: 0.8 }}>—</div>
            ) : (
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {counts.topPains.map(([p, n]) => (
                  <li key={p}>
                    {p} ({n})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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

function SelectSimple(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
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

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 700, display: "block" }}>{props.label}</label>
      <input
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={inputStyle}
      />
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

const h3: CSSProperties = { marginTop: 0, marginBottom: 10, fontSize: 16, fontWeight: 800 };
const h4: CSSProperties = { marginTop: 14, marginBottom: 8, fontSize: 14, fontWeight: 900, opacity: 0.9 };

const panelStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
};

const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const inputStyle: CSSProperties = {
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

const btnStyle: CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  background: "transparent",
  cursor: "pointer",
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

const sessionCardStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 14,
};
