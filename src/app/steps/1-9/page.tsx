"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type Step19Payload = {
  valueHook: string;
  whoCares: string;
  metricTied: string;
  proofPoint: string;
  callToAction: string;
  updatedAt?: string;
};

const STEP_ID = "1-9";

export default function Step19Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step19Payload>(
    STEP_ID,
    {
      valueHook: "",
      whoCares: "",
      metricTied: "",
      proofPoint: "",
      callToAction: "",
    }
  );

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.9: Value Hook"
      subtitle="One line value tied to a metric. Not a slogan."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
        <StepHelp title="How to write a good value hook">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
            This is not marketing. It’s a <strong>testable promise</strong> tied to the metrics you picked in Step 1.4.
            If there’s no baseline/target/time window, it’s a slogan.
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
                <strong>Format:</strong> For [who], we [do what], so [metric] moves from [baseline] to [target] within [time].
            </li>
            <li>
                <strong>Who cares:</strong> Name the buyer and the primary user (often not the same organism).
            </li>
            <li>
                <strong>Metric tied:</strong> Must map to a Step 1.4 lead metric (or a guardrail, but say so).
            </li>
            <li>
                <strong>Proof point:</strong> Smallest credible evidence (quotes, audits, timestamps, pilot counts). Not “we believe”.
            </li>
            <li>
                <strong>Call to Action (CTA):</strong> One next step that gets you evidence (observe, pilot, intro, 15-minute call).
            </li>
            </ul>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Template (copy/paste)</strong>
            <div style={{ marginTop: 6, padding: 10, border: "1px solid #ddd", borderRadius: 10 }}>
                For (buyer + setting), we (action) so that (metric) moves from (baseline) to (target) within (time), without (guardrail getting worse).
            </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Good vs bad</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li><strong>Bad:</strong> “Streamline workflows with a modern platform.”</li>
                <li><strong>Good:</strong> “For clinic admins, we cut incomplete submissions from 60% to 30% within 2 weeks by enforcing required fields at booking.”</li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Devil’s-advocate check: If you can’t tie it to a metric from 1.4, you don’t have a value hook. You have a vibe.
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Done looks like:</strong> One line with who + action + baseline + target + time window, plus proof + CTA.
            </div>
        </div>
        </StepHelp>


      <Card>
        <Field
          label="Value hook (one-liner)"
          value={value.valueHook}
          onChange={(v) => setValue({ ...value, valueHook: v })}
          placeholder="For [who], we [do what], so [metric] goes from [baseline] to [target] within [time], without (guardrail getting worse)."
        />
        <Area
          label="Who cares (buyer + user)"
          value={value.whoCares}
          onChange={(v) => setValue({ ...value, whoCares: v })}
          placeholder={
            "Name buyer + user + why now.\n" +
            "- Buyer (who pays): ___\n" +
            "- Primary user (who uses weekly): ___\n" +
            "- Why they care: time / risk / cost / compliance\n" +
            "- Trigger moment: when does this pain hit?\n" +
            "- Why now: what changed (policy, volume, staffing, risk)?"
            }
        />
        <Field
          label="Metric tied"
          value={value.metricTied}
          onChange={(v) => setValue({ ...value, metricTied: v })}
          placeholder="(From Step 1.4) Pick one: Lead Metric 1 / Lead Metric 2 / Guardrail (name it exactly)."
        />
        <Area
          label="Proof point"
          value={value.proofPoint}
          onChange={(v) => setValue({ ...value, proofPoint: v })}
          placeholder={
            "Smallest credible evidence you already have (or will have this week).\n" +
            "- __ interviews with direct quotes\n" +
            "- __ observations of the workflow\n" +
            "- __ audits / counts / timestamps\n" +
            "- Key proof artifact(s): screenshot/photo/log (de-identified)\n" +
            "- What result would make this believable?"
            }
        />
        <Area
          label="Call to action"
          value={value.callToAction}
          onChange={(v) => setValue({ ...value, callToAction: v })}
          placeholder={
            "One next step that gets evidence.\n" +
            "Examples:\n" +
            "- “Can we observe 2 sessions next week?”\n" +
            "- “Can we run a 7-day pilot with 10 cases?”\n" +
            "- “Can you intro us to the person who approves this?”\n" +
            "- “15-minute call to confirm workflow + metrics.”\n" +
            "Write the exact ask:"
            }
          minH={120}
        />
      </Card>
    </StepShell>
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
      <label style={{ fontWeight: 700 }}>{props.label}</label>
      <input
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
      <label style={{ fontWeight: 700 }}>{props.label}</label>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={textareaStyle(props.minH ?? 110)}
      />
    </div>
  );
}

const inputStyle: CSSProperties = {
  marginTop: 8,
  width: "100%",
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
    minHeight,
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 12,
    fontFamily: "system-ui",
    background: "transparent",
    color: "inherit",
  };
}
