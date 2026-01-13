"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type Step17Payload = {
  beforeState: string;
  afterState: string;
  solutionHypothesis: string;
  workflowChange: string;
  risksAndFailureModes: string;
  updatedAt?: string;
};

const STEP_ID = "1-7";

export default function Step17Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step17Payload>(
    STEP_ID,
    {
      beforeState: "",
      afterState: "",
      solutionHypothesis: "",
      workflowChange: "",
      risksAndFailureModes: "",
    }
  );

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.7: Before/After & Solution Hypothesis"
      subtitle="Describe the workflow before and after, and your best current solution hypothesis."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
        <StepHelp title="How to fill this in">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
            This step is your “mini spec” for a reviewer: <strong>before</strong>, <strong>after</strong>, and the
            <strong> falsifiable claim</strong> that links your solution to a measurable change (from Step 1.4).
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
                <strong>Before:</strong> write the current workflow as steps. Include actors + tools + handoffs + failure points.
            </li>
            <li>
                <strong>After:</strong> same level of detail. If you can’t write it step-by-step, you don’t know what you’re building.
            </li>
            <li>
                <strong>Solution hypothesis:</strong> “If we do X, then user does Y, so metric Z moves by N within T.”
            </li>
            <li>
                <strong>Workflow change:</strong> list what is removed, automated, or added (specific steps/decisions).
            </li>
            <li>
                <strong>Risks/failure modes:</strong> adoption, incentives, privacy, workload, integration, edge cases.
            </li>
            </ul>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Template (copy/paste)</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                <strong>Before:</strong> 1) ___ triggers ___. 2) ___ does ___ using ___. 3) Handoff to ___ via ___. 4) Breaks when ___.
                </li>
                <li>
                <strong>After:</strong> 1) ___ triggers ___. 2) ___ captures ___ in ___. 3) ___ auto-routes to ___. 4) ___ confirms/approves.
                </li>
                <li>
                <strong>Hypothesis:</strong> If we provide ___, then ___ will ___, which increases/decreases ___ (metric) from __ to __ within __.
                </li>
                <li>
                <strong>Workflow change:</strong> Remove: ___. Add: ___. Automate: ___. New decision: ___. New handoff: ___.
                </li>
                <li>
                <strong>Failure modes:</strong> Users won’t ___ because ___. Buyer blocks due to ___. Data risk: ___. Time cost: ___. Integration: ___.
                </li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Devil’s-advocate check: if your “after” doesn’t remove at least one real step/decision, you’re describing vibes.
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Done looks like:</strong> a reviewer can point to exactly what changes in the workflow and which metric should move.
            </div>
        </div>
        </StepHelp>


      <Card>
        <Area
          label="Before (current state)"
          value={value.beforeState}
          onChange={(v) => setValue({ ...value, beforeState: v })}
          placeholder="What happens today? Who does what, when?"
        />
        <Area
          label="After (desired state)"
          value={value.afterState}
          onChange={(v) => setValue({ ...value, afterState: v })}
          placeholder="What changes? What becomes faster/safer/easier?"
        />
        <Area
          label="Solution hypothesis"
          value={value.solutionHypothesis}
          onChange={(v) => setValue({ ...value, solutionHypothesis: v })}
          placeholder="If we provide X, users do Y, resulting in Z metric change."
        />
        <Area
          label="Workflow change (step-by-step)"
          value={value.workflowChange}
          onChange={(v) => setValue({ ...value, workflowChange: v })}
          placeholder="Specific steps: what gets removed, added, automated."
        />
        <Area
          label="Risks / failure modes"
          value={value.risksAndFailureModes}
          onChange={(v) => setValue({ ...value, risksAndFailureModes: v })}
          placeholder="Adoption, privacy, time, incentives, failure points."
          minH={140}
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

function Area(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; minH?: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 700 }}>{props.label}</label>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={textareaStyle(props.minH ?? 120)}
      />
    </div>
  );
}

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
