"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type MetricSpec = {
  name: string;
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
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step14Payload>(
    STEP_ID,
    {
      leadMetric1: { name: "", baseline: "", target: "", howMeasured: "", window: "" },
      leadMetric2: { name: "", baseline: "", target: "", howMeasured: "", window: "" },
      guardrails: "",
      measurementPlan: "",
    }
  );

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
            This step is about picking <strong>2 lead metrics</strong> that you can <strong>actually</strong> measure next week. Not “revenue”, not “awareness”,
            not “better care”. Something you can count or time without inventing new infrastructure.
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
                <strong>Lead metric</strong> = Early signal you can move quickly (minutes, completion %, error count, handoffs, drop-off).
            </li>
            <li>
                <strong>Good metric format:</strong> <em>Unit + denominator + time window</em>. Example: “% of referrals triaged within 24h (n=20/week)”.
            </li>
            <li>
                <strong>Baseline:</strong> What’s true today. If it’s a guess, write “estimate” + how you’ll confirm.
            </li>
            <li>
                <strong>Target:</strong> A specific improvement over a specific window. “Increase” is not a target.
            </li>
            <li>
                <strong>How measured:</strong> Where the evidence comes from (audit, timestamps, count, observation). “We feel it” is not evidence.
            </li>
            <li>
                <strong>Window / frequency:</strong> When you’ll measure and how many samples (e.g. 10 cases, 5-day window).
            </li>
            <li>
                <strong>Guardrails:</strong> What must not get worse (time burden, errors, safety incidents, satisfaction). Ideally add a threshold.
            </li>
            </ul>

            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <strong>Examples</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                <strong>Lead metric:</strong> “Median time to complete intake form (minutes)”.
                <br />
                <strong>Baseline:</strong> 12 min (self-timed, n=10). <strong>Target:</strong> 6 min within 2 weeks.
                <br />
                <strong>How it's measured:</strong> timestamps on form start/submit. <strong>Window:</strong> weekly, first 10 cases.
                </li>
                <li>
                <strong>Lead metric:</strong> “% cases with all required fields completed at first submission”.
                <br />
                <strong>Baseline:</strong> 40% (audit of last 20). <strong>Target:</strong> 70% next week.
                <br />
                <strong>How measured:</strong> checklist audit. <strong>Window:</strong> next 20 cases.
                </li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <strong>Common mistakes</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Picking a lag metric (revenue, retention) that won’t move next week.</li>
                <li>Missing a denominator (“more consults” vs “% consults with complete pre-info”).</li>
                <li>Targets with no timeframe (“improve by a lot”).</li>
                <li>Measurement method = “we’ll ask people” with no structured capture.</li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
            If you can’t measure it next week, it’s a wish, not a metric.
            </div>

            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <strong>Done looks like:</strong> two metrics with baseline + target + method + sample/window, plus guardrails that prevent accidental harm.
            </div>
        </div>
    </StepHelp>


<div></div>
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
        placeholder="e.g. % of Referrals triaged within 24h (n=20/week)"
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
        placeholder="e.g. Timestamp audit, checklist audit, manual count, observation sheet"
      />
      <Field
        label="Window / frequency"
        value={v.window}
        onChange={(x) => props.onChange({ ...v, window: x })}
        placeholder="e.g. Next week, n=10 cases, measure daily, 5-day window"
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

