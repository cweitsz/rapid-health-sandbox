"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type Step13Payload = {
  currentWorkflow: string;
  workarounds: string;
  whyItPersists: string;
  costsAndRisks: string;
  constraintsSnapshot: string;
  updatedAt?: string;
};

const STEP_ID = "1-3";

export default function Step13Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step13Payload>(
    STEP_ID,
    {
      currentWorkflow: "",
      workarounds: "",
      whyItPersists: "",
      costsAndRisks: "",
      constraintsSnapshot: "",
    }
  );

  if (!isReady) return <Loading />;

  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.3: Workarounds & Status Quo"
      subtitle="What are people doing today, and why does it keep winning?"
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
        <StepHelp title="How to fill this in">
            <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                This step is about the enemy you’re actually competing with: <strong>the current workaround</strong>.
                If the status quo is “good enough”, your problem isn't real, and your solution won't get used.
                </div>

                <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                <li>
                    <strong>Current workflow:</strong> Write it as a full sequence. Who does what, in what order, with what handoffs.
                </li>
                <li>
                    <strong>Workarounds:</strong> Use <em>verbs + tools</em> (“copy into Excel”, “text the clinician”, “print and file”).
                </li>
                <li>
                    <strong>Why it persists:</strong> Incentives + friction (switching cost, trust, habit, compliance, procurement).
                </li>
                <li>
                    <strong>Costs/risks:</strong> Be concrete. Minutes, rework, error risk, missed info, delays, complaints, burnout.
                </li>
                <li>
                    <strong>Constraints snapshot:</strong> The things you can’t ignore (budget, IT, privacy, staffing, timing, scope).
                </li>
                </ul>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                <strong>Template (copy/paste into the boxes if stuck)</strong>
                <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                    <li>
                    <strong>Workflow:</strong> 1) ___ does ___ using ___. 2) ___ reviews ___. 3) ___ approves ___. 4) ___ follows up ___.
                    </li>
                    <li>
                    <strong>Workarounds:</strong> “___ in Excel”, “___ via email”, “___ by phone”, “___ on paper”, “___ from memory”.
                    </li>
                    <li>
                    <strong>Persists because:</strong> “___ is faster”, “___ is trusted”, “___ is mandated”, “no budget”, “integration risk”, “change fatigue”.
                    </li>
                    <li>
                    <strong>Costs/risks:</strong> “Adds ~__ min per case”, “__% rework”, “missed info leads to ___”, “delays of __ days”.
                    </li>
                    <li>
                    <strong>Constraints:</strong> “Must work with ___”, “no new logins”, “data can’t leave ___”, “training time &lt; __ min”, “budget &lt; $__/mo”.
                    </li>
                </ul>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                Sanity check: if the workaround is cheap and “good enough”, your new thing must be{" "}
                <strong>dramatically</strong> better (time, risk, or cost), or adoption wont happen.
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                <strong>Done looks like:</strong> You can point to (1) the exact steps today, (2) the workarounds people use, and (3) the reasons they won’t switch tomorrow.
                </div>
            </div>
            </StepHelp>



      <Card>
        <Area
          label="Current workflow (today)"
          value={value.currentWorkflow}
          onChange={(v) => setValue({ ...value, currentWorkflow: v })}
          placeholder="Step-by-step, what happens now?"
        />
        <Area
          label="Workarounds people use"
          value={value.workarounds}
          onChange={(v) => setValue({ ...value, workarounds: v })}
          placeholder="Use spreadsheets, send emails, make phone calls, write on sticky notes, etc."
        />
        <Area
          label="Why it persists"
          value={value.whyItPersists}
          onChange={(v) => setValue({ ...value, whyItPersists: v })}
          placeholder="Incentives, switching cost, habits, procurement, compliance."
        />
        <Area
          label="Costs / risks of the status quo"
          value={value.costsAndRisks}
          onChange={(v) => setValue({ ...value, costsAndRisks: v })}
          placeholder="Time, rework, safety, missed info, complaints, burnout."
        />
        <Area
          label="Constraints snapshot"
          value={value.constraintsSnapshot}
          onChange={(v) => setValue({ ...value, constraintsSnapshot: v })}
          placeholder="Budget, IT constraints, privacy, staffing, time, scope boundaries."
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

function Area(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minH?: number;
}) {
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
  };
}
