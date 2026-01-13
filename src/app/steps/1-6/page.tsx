"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type Step16Payload = {
  method: "interviews" | "observation" | "mixed";
  targetParticipants: string;
  samplingBox: string;
  scriptOrProtocol: string;
  consentPrivacyNotes: string;
  schedulePlan: string;
  dataCapturePlan: string;
  whatCountsAsPassFail: string;
  updatedAt?: string;
};

const STEP_ID = "1-6";

export default function Step16Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step16Payload>(
    STEP_ID,
    {
      method: "mixed",
      targetParticipants: "",
      samplingBox: "",
      scriptOrProtocol: "",
      consentPrivacyNotes: "",
      schedulePlan: "",
      dataCapturePlan: "",
      whatCountsAsPassFail: "",
    }
  );

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.6: Problem Validation Interviews/Observation"
      subtitle="Plan how you’ll collect real evidence: who, how many, what you’ll record, and how you’ll decide."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
      <StepHelp title="How to fill this in">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
            This step turns your plan into something a reviewer can trust: <strong>Who</strong> you’ll talk to/observe,
            <strong>What</strong> you’ll capture, and <strong>How</strong> you’ll decide Go / Iterate / Stop.
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
                <strong>Target participants:</strong> Roles + context + count (e.g. “4 practice managers in clinics with 3–10 clinicians”).
            </li>
            <li>
                <strong>Sampling box:</strong> Inclusion/exclusion. Prevents “we interviewed whoever replied”.
            </li>
            <li>
                <strong>Script/protocol:</strong> 6–8 questions you will actually use, or an observation checklist.
            </li>
            <li>
                <strong>Consent + privacy:</strong> What you’ll say, what you store, where, for how long, and what you will never collect.
            </li>
            <li>
                <strong>Data capture:</strong> Define artifacts (notes template, recordings yes/no, screenshots, timestamps, counts).
            </li>
            <li>
                <strong>Pass/fail:</strong> Operational thresholds. If your criteria could justify any outcome, it’s not pass/fail.
            </li>
            </ul>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Minimum viable evidence pack (what you should aim to produce)</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>10–12 short interviews OR 3–5 workflow observations (or mixed).</li>
                <li>Notes template used consistently (same headings every time).</li>
                <li>At least 10 direct quotes tagged by role + context.</li>
                <li>At least 3 “proof” artifacts: screenshots/photos of workaround, logs, timestamps, counts (de-identified).</li>
                <li>Clear Go/Iterate/Stop decision rule written before you start.</li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Pass/fail examples</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                <strong>Go:</strong> 7/10 participants report the pain weekly AND can describe a current workaround used in the last 7 days.
                </li>
                <li>
                <strong>Iterate:</strong> Pain exists but only in a narrower context (e.g. only large clinics) OR the buyer is different than assumed.
                </li>
                <li>
                <strong>Stop:</strong> Fewer than 3/10 report meaningful pain OR workaround is fast/cheap and switching cost is too high.
                </li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Devil’s-advocate check: if you don’t specify the artifact you’ll collect, you’ll end up with “insights” and no evidence.
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Done looks like:</strong> someone else could run your interviews/observation next week and produce comparable evidence.
            </div>
        </div>
        </StepHelp>

      <Card>
        <Select
          label="Method"
          value={value.method}
          onChange={(v) => setValue({ ...value, method: v as Step16Payload["method"] })}
          options={[
            { value: "interviews", label: "Interviews" },
            { value: "observation", label: "Observation" },
            { value: "mixed", label: "Mixed" },
          ]}
        />

        <Area
          label="Target participants"
          value={value.targetParticipants}
          onChange={(v) => setValue({ ...value, targetParticipants: v })}
          placeholder={
            "Roles + context + count. One line per segment.\n" +
            "- __ x (role) in (setting)\n" +
            "- __ x (role) in (setting)\n" +
            "Example:\n" +
            "- 4 x practice managers in clinics with 3–10 clinicians\n" +
            "- 4 x reception/admin staff who handle intake daily\n" +
            "- 2 x clinicians who receive the handoff"
            }
        />
        <Area
          label="Sampling box"
          value={value.samplingBox}
          onChange={(v) => setValue({ ...value, samplingBox: v })}
          placeholder={
            "Inclusion / exclusion. Be specific.\n\n" +
            "Include:\n" +
            "- Location: ___\n" +
            "- Setting: ___\n" +
            "- Volume: ___\n" +
            "- Must currently do ___\n" +
            "Exclude:\n" +
            "- ___ (reason)\n" +
            "- ___ (reason)"
            }
        />
        <Area
          label="Script / protocol"
          value={value.scriptOrProtocol}
          onChange={(v) => setValue({ ...value, scriptOrProtocol: v })}
          placeholder={
            "Either paste a link OR list the 6–8 prompts/checkpoints you will actually use.\n" +
            "Interview prompts (example structure):\n" +
            "1) Walk me through the last time you did ___.\n" +
            "2) Where does it break down? What happens next?\n" +
            "3) What workaround do you use? Show me if possible.\n" +
            "4) What does it cost you (time/rework/risk)?\n" +
            "5) Who else is involved? Who approves change?\n" +
            "6) What would make you switch? What would stop you?\n" +
            "7) If this disappeared tomorrow, what would happen?\n" +
            "8) Anything I didn’t ask that matters?"
            }
        />
        <Area
          label="Consent + privacy notes"
          value={value.consentPrivacyNotes}
          onChange={(v) => setValue({ ...value, consentPrivacyNotes: v })}
          placeholder={
            "Write what you will say + what you will do with data.\n" +
            "Consent script (example):\n" +
            "- Purpose: __\n" +
            "- Voluntary + can stop anytime\n" +
            "- Recording: yes/no (and how you’ll store it)\n" +
            "- We will NOT collect: names, DOB, addresses, identifiable patient details\n" +
            "- Storage: where + who can access\n" +
            "- Retention: how long, then delete\n" +
            "- De-identification: how you’ll do it"
            }
          minH={120}
        />
        <Area
          label="Schedule plan"
          value={value.schedulePlan}
          onChange={(v) => setValue({ ...value, schedulePlan: v })}
          placeholder="When, cadence, recruiting plan."
        />
        <Area
          label="Data capture plan"
          value={value.dataCapturePlan}
          onChange={(v) => setValue({ ...value, dataCapturePlan: v })}
          placeholder={
            "Define the artifacts you’ll capture (so you don’t end up with vibes).\n" +
            "- Notes template: (headings)\n" +
            "- Recording: yes/no\n" +
            "- Quotes captured: __ per interview (tagged by role)\n" +
            "- Screenshots/photos of workaround: yes/no (de-identified)\n" +
            "- Counts/timestamps to record: ___\n" +
            "- Where stored: ___ (folder/spreadsheet/exported JSON)"
            }
        />
        <Area
          label="Decision rule (Go / Iterate / Stop)"
          value={value.whatCountsAsPassFail}
          onChange={(v) => setValue({ ...value, whatCountsAsPassFail: v })}
          placeholder={
            "Write thresholds for Go / Iterate / Stop.\n" +
            "Go if:\n" +
            "- __/10 report pain at least weekly AND can show a workaround used recently\n" +
            "Iterate if:\n" +
            "- Pain exists but only in ___ context OR buyer/approver differs from assumption\n" +
            "Stop if:\n" +
            "- Fewer than __/10 report meaningful pain OR workaround is fast/cheap and switching isn’t worth it"
            }
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

function Select(props: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 700 }}>{props.label}</label>
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

const selectStyle: CSSProperties = {
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
