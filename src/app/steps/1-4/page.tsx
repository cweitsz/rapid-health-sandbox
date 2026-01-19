// src/app/steps/1-4/page.tsx
"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type MetricSpec = {
  name: string;
  definition: string; // optional but helpful for review + 1.6 wiring
  baseline: string;
  target: string;
  howMeasured: string;
  window: string;
};

type Step14Payload = {
  leadMetric1: MetricSpec;
  leadMetric2: MetricSpec;
  guardrails: string;
  measurementPlan: string;
  updatedAt?: string;
};

const STEP_ID = "1-4";

export default function Step14Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step14Payload>(STEP_ID, {
    leadMetric1: { name: "", definition: "", baseline: "", target: "", howMeasured: "", window: "" },
    leadMetric2: { name: "", definition: "", baseline: "", target: "", howMeasured: "", window: "" },
    guardrails: "",
    measurementPlan: "",
  });

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.4: Measurable Indicators"
      subtitle="Pick 2 lead metrics you can measure next week. Specify baseline, target, method, and guardrails."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
      <StepHelp title="How to fill this in">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Pick <strong>2 lead metrics</strong> you can <strong>actually</strong> measure next week. Not “revenue”, not “awareness”,
            not “better care”. Something you can count or time without inventing new infrastructure.
          </div>

          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
              <strong>Lead metric</strong> = early signal you can move quickly (minutes, completion %, error count, handoffs, drop-off).
            </li>
            <li>
              <strong>Good format:</strong> <em>unit + denominator + time window</em>. Example: “% referrals triaged within 24h (n=20/week)”.
            </li>
            <li>
              <strong>Baseline:</strong> what’s true today. If it’s a guess, write “estimate” + how you’ll confirm.
            </li>
            <li>
              <strong>Target:</strong> specific improvement over a specific window. “Increase” is not a target.
            </li>
            <li>
              <strong>How measured:</strong> where evidence comes from (audit, timestamps, counts). “We feel it” is not evidence.
            </li>
            <li>
              <strong>Window / frequency:</strong> when you’ll measure and sample size (e.g. 10 cases in a 5-day window).
            </li>
            <li>
              <strong>Guardrails:</strong> what must not get worse (time burden, errors, safety). Add thresholds if you can.
            </li>
          </ul>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <strong>Done looks like:</strong> two metrics with baseline + target + method + sample/window, plus guardrails that prevent accidental harm.
          </div>
        </div>
      </StepHelp>

      <Card>
        <h3 style={h3}>Lead metric 1</h3>
        <MetricEditor value={value.leadMetric1} onChange={(m) => setValue({ ...value, leadMetric1: m })} />

        <div style={{ height: 14 }} />

        <h3 style={h3}>Lead metric 2</h3>
        <MetricEditor value={value.leadMetric2} onChange={(m) => setValue({ ...value, leadMetric2: m })} />

        <div style={{ height: 14 }} />

        <Area
          label="Guardrail metrics - What must NOT get worse?"
          value={value.guardrails}
          onChange={(v) => setValue({ ...value, guardrails: v })}
          placeholder={
            "- Clinician/admin time: +0 min (or < +2 min)\n" +
            "- Errors: no increase in missing critical fields\n" +
            "- Safety: 0 safety incidents attributable\n" +
            "- Satisfaction: not below X/10"
          }
        />

        <Area
          label="Measurement plan - Who measures, when, where, and decision rule"
          value={value.measurementPlan}
          onChange={(v) => setValue({ ...value, measurementPlan: v })}
          placeholder={
            "- Owner: (role)\n" +
            "- Data source: (audit / timestamps / observation)\n" +
            "- Cadence: (daily/weekly)\n" +
            "- Sample: (n=__ cases)\n" +
            "- Where stored: (spreadsheet / notes / exported JSON)\n" +
            "- Decision rule: if baseline→target not moving by date ___, we stop/iterate"
          }
          minH={140}
        />
      </Card>
    </StepShell>
  );
}

function MetricEditor(props: { value: MetricSpec; onChange: (v: MetricSpec) => void }) {
  const v = props.value;

  return (
    <div style={panelStyle}>
      <Field
        label="Metric name"
        value={v.name}
        onChange={(x) => props.onChange({ ...v, name: x })}
        placeholder="e.g. % of referrals triaged within 24h (n=20/week)"
      />

      <Area
        label="Definition (optional)"
        value={v.definition}
        onChange={(x) => props.onChange({ ...v, definition: x })}
        placeholder="What exactly counts? Any exclusions? How is denominator defined?"
        minH={80}
      />

      <div style={rowStyle}>
        <Field
          label="Baseline"
          value={v.baseline}
          onChange={(x) => props.onChange({ ...v, baseline: x })}
          placeholder="e.g. 30% (audit last 20) or ~12 min (estimate)"
        />
        <Field
          label="Target"
          value={v.target}
          onChange={(x) => props.onChange({ ...v, target: x })}
          placeholder="e.g. 60% next week OR 6 min within 2 weeks"
        />
      </div>

      <Field
        label="How measured"
        value={v.howMeasured}
        onChange={(x) => props.onChange({ ...v, howMeasured: x })}
        placeholder="e.g. timestamp audit, checklist audit, manual count, observation sheet"
      />
      <Field
        label="Window / frequency"
        value={v.window}
        onChange={(x) => props.onChange({ ...v, window: x })}
        placeholder="e.g. next week, n=10 cases, measure daily, 5-day window"
      />
    </div>
  );
}

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
  return <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16 }}>{children}</div>;
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

const h3: CSSProperties = { marginTop: 8, marginBottom: 8, fontSize: 16, fontWeight: 800 };

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
  display: "block",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: 12,
  fontFamily: "system-ui",
  background: "transparent",
  color: "inherit",
};

function textareaStyle(minHeight: number): CSSProperties {
  return {
    marginTop: 8,
    width: "100%",
    display: "block",
    boxSizing: "border-box",
    minHeight,
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 12,
    fontFamily: "system-ui",
    background: "transparent",
    color: "inherit",
  };
}
