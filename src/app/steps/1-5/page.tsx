"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type Hypothesis = {
  statement: string;
  howWrong: string;
  testPlan: string;
  evidenceToCollect: string;
};

type Step15Payload = {
  h1: Hypothesis;
  h2: Hypothesis;
  h3: Hypothesis;
  updatedAt?: string;
};

const STEP_ID = "1-5";

export default function Step15Page() {
  const blank: Hypothesis = { statement: "", howWrong: "", testPlan: "", evidenceToCollect: "" };

  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step15Payload>(
    STEP_ID,
    { h1: { ...blank }, h2: { ...blank }, h3: { ...blank } }
  );

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.5: Disconfirming Hypotheses"
      subtitle="Write 2–3 ways you could be wrong and how you’ll test it fast."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
      <StepHelp title="How to fill this in">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
            This is the “kill your own idea quickly” step. You’re writing <strong>failure modes</strong>, not risks.
            A good hypothesis here has a clear <strong>disconfirming result</strong> that would make you stop or pivot. This is really important for ensuring successful outcomes later.
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
                Write as: <strong>“We are wrong if…”</strong> or <strong>“This fails if…”</strong>
            </li>
            <li>
                Make it <strong>testable fast</strong> (next week / next 10 interviews / next 5 observations).
            </li>
            <li>
                Make it <strong>binary-ish</strong>: a threshold, count, or observable behaviour. Not vibes.
            </li>
            <li>
                State the <strong>decision rule</strong>: what result means “stop/iterate/go”.
            </li>
            <li>
                Evidence = Artifacts: quotes, screenshots, counts, timestamps, recordings notes, observation write-ups.
            </li>
            </ul>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Template (copy/paste if stuck)</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                <strong>Statement:</strong> We are wrong if ___.
                </li>
                <li>
                <strong>How wrong looks:</strong> We would observe ___ (in the real workflow).
                </li>
                <li>
                <strong>Test plan:</strong> In the next __ days, test with __ (roles). Do __ (interview/observe/task). Record __.
                </li>
                <li>
                <strong>Decision rule:</strong> If __/__(count) say/do ___, we stop/iterate. If we hit ___, we proceed.
                </li>
                <li>
                <strong>Evidence to collect:</strong> __ quotes, __ screenshots, __ timestamps/logs, __ observation notes.
                </li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Tip: if you can’t describe what “wrong” looks like, your optimism bias is showing. Be brutally honest with yourself! 
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Done looks like:</strong> 2–3 disconfirming hypotheses with a timeboxed test and a clear “stop/iterate/go” threshold.
            </div>
        </div>
        </StepHelp>


      <Card>
        <HypothesisEditor title="Hypothesis 1" value={value.h1} onChange={(h) => setValue({ ...value, h1: h })} />
        <Divider />
        <HypothesisEditor title="Hypothesis 2" value={value.h2} onChange={(h) => setValue({ ...value, h2: h })} />
        <Divider />
        <HypothesisEditor
          title="Hypothesis 3 (optional)"
          value={value.h3}
          onChange={(h) => setValue({ ...value, h3: h })}
        />
      </Card>
    </StepShell>
  );
}

function HypothesisEditor(props: { title: string; value: Hypothesis; onChange: (v: Hypothesis) => void }) {
  const v = props.value;
  return (
    <div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{props.title}</h3>
      <Area
        label="Statement"
        value={v.statement}
        onChange={(x) => props.onChange({ ...v, statement: x })}
        placeholder={
            "Write this as a failure mode.\n" +
            "Start with: “We are wrong if…”\n" +
            "Examples:\n" +
            "- We are wrong if users don’t experience this weekly.\n" +
            "- We are wrong if the workaround is good enough and switching isn’t worth it.\n" +
            "- We are wrong if the buyer won’t pay because the value doesn’t land."
            }
      />
      <Area
        label="What we'd observe if we're wrong"
        value={v.howWrong}
        onChange={(x) => props.onChange({ ...v, howWrong: x })}
        placeholder={
            "What would you observe if this is false? Be concrete.\n" +
            "Examples:\n" +
            "- They already have a workaround that takes <5 minutes.\n" +
            "- They say it’s annoying but not worth changing.\n" +
            "- They refuse to change workflow / add logins / share data.\n" +
            "- They can’t name a consequence (time, risk, cost)."
            }

      />
      <Area
        label="Test plan"
        value={v.testPlan}
        onChange={(x) => props.onChange({ ...v, testPlan: x })}
        placeholder={
            "Timebox + sample + method:\n" +
            "In the next __ days:\n" +
            "- Test with: __ (roles)\n" +
            "- Method: interview / observe / do a task\n" +
            "- Prompt: what you’ll ask or what you’ll watch\n" +
            "- Capture: notes + quotes + counts"
            }
      />
      <Area
        label="Evidence to collect"
        value={v.evidenceToCollect}
        onChange={(x) => props.onChange({ ...v, evidenceToCollect: x })}
        placeholder={
            "List the artifacts you will collect:\n" +
            "- __ direct quotes (with role + context)\n" +
            "- __ screenshots/photos of the workaround\n" +
            "- __ counts/timestamps (e.g. time to complete)\n" +
            "- __ observation write-ups\n" +
            "- Decision rule recorded (what result means stop/iterate/go)"
            }
        minH={120}
      />
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#ddd", margin: "14px 0" }} />;
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
        style={textareaStyle(props.minH ?? 90)}
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
