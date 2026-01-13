"use client";

import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";
import type { Dossier } from "@/lib/dossier";

type Step11Payload = {
  user: string;
  jtbd: string;
  pain: string;
  impact: string;
  oneLine: string;
  updatedAt?: string;
};

const STEP_ID = "1-1";

function syncStep11ToMeta(d: Dossier, v: Step11Payload) {
  if (v.oneLine?.trim()) d.meta.oneLineProblem = v.oneLine.trim();
}

export default function Step11Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step11Payload>(
    STEP_ID,
    { user: "", jtbd: "", pain: "", impact: "", oneLine: "" },
    { syncMeta: syncStep11ToMeta }
  );

  // Prevent hydration mismatch: server + first client render match
  if (!isReady) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!dossierId || !dossier) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>
          No active dossier found. Go to <Link href="/intake">/intake</Link>.
        </p>
      </main>
    );
  }

  // Freeze non-null for callbacks
  const did = dossierId;
  const dos = dossier;

  function composeOneLine() {
    const parts = [
      value.user.trim() ? `${value.user.trim()}` : "",
      value.jtbd.trim() ? `is trying to ${value.jtbd.trim()}` : "",
      value.pain.trim() ? `but ${value.pain.trim()}` : "",
      value.impact.trim() ? `which leads to ${value.impact.trim()}` : "",
    ].filter(Boolean);

    setValue({ ...value, oneLine: parts.join(" ") });
  }

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.1: Problem Definition"
      subtitle="Define the user, job-to-be-done, pain, and impact in one line."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
            <StepHelp title="How to fill this in">
              <ul style={{ marginTop: 8, lineHeight: 1.6, paddingLeft: 18 }}>
                <li>
                  <strong>User (who?):</strong> pick <em>one</em> primary user segment. Not “everyone”, not “the system”.
                 Choose the person who feels the pain daily and would notice if it disappeared.
                </li>
                <li>
                  <strong>Job-to-be-done:</strong> describe the outcome they’re trying to achieve in plain language.
                  Good: “triage referrals safely in under 2 minutes.” Bad: “use our app to triage referrals.”
                </li>
                <li>
                  <strong>Pain:</strong> what makes the job hard <em>today</em>. Think: time, rework, missing info, uncertainty,
                  risk, handoffs, training burden, compliance friction.
                </li>
                <li>
                  <strong>Impact (so what?):</strong> the consequence if the pain persists. Use something you can later measure:
                  minutes wasted, % drop-off, errors, delays, complaints, missed diagnoses, staff burnout, revenue leakage.
                </li>
                <li>
                  <strong>One-line statement:</strong> should read like:
                  “<em>(User)</em> is trying to <em>(Job-To-Be-Done)</em> but <em>(Pain)</em>, which leads to <em>(Impact)</em>.”
                </li>
              </ul>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                <strong>Examples</strong>
                <ul style={{ marginTop: 6, lineHeight: 1.6, paddingLeft: 18 }}>
                  <li>
                    “GP clinic admins are trying to prep consults with complete patient info but intake arrives fragmented across forms,
                    calls, and emails, which leads to longer consults and higher risk of missed details.”
                  </li>
                  <li>
                    OR
                  </li>
                  <li>
                    “Small builders are trying to produce accurate quotes quickly but job details arrive incomplete and change mid-stream, which leads to rework, pricing errors, and margin loss.”
                  </li>
                </ul>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                <strong>Common mistakes</strong>
                <ul style={{ marginTop: 6, lineHeight: 1.6, paddingLeft: 18 }}>
                  <li>Making the user “Australia” or “healthcare”. Pick the PERSON doing the work.</li>
                  <li>Writing a solution (“Needs an AI tool”) instead of a job (“needs to decide X with Y constraint”).</li>
                  <li>Calling pain “Impact”. If you can’t measure it later, it’s probably still pain.</li>
                </ul>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                <strong>Done looks like:</strong> Someone unfamiliar can read your one-line statement and say “Yep, I get who this is,
                what they’re trying to do, what’s in the way, and why it matters.”
              </div>
            </StepHelp>


      <Card>
        <Field
          label="User (The person doing the job)"
          value={value.user}
          onChange={(v) => setValue({ ...value, user: v })}
          placeholder="e.g. GP clinic admin / new grad physio / patient"
        />
        <Field
          label="Job-to-be-done (What are they trying to do?)"
          value={value.jtbd}
          onChange={(v) => setValue({ ...value, jtbd: v })}
          placeholder="e.g. Prep a consult efficiently with complete info"
        />
        <Field
          label="Pain (What makes it hard today/currently?)"
          value={value.pain}
          onChange={(v) => setValue({ ...value, pain: v })}
          placeholder="e.g. Info arrives fragmented across channels"
        />
        <Field
          label="Impact (What is the measurable consequence?)"
          value={value.impact}
          onChange={(v) => setValue({ ...value, impact: v })}
          placeholder="e.g. Longer consults, rework, higher risk of missing key details"
        />

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <label style={{ fontWeight: 700 }}>One-line problem statement</label>
            <button type="button" onClick={composeOneLine} style={btnStyle}>
              Compose from fields
            </button>
          </div>

          <textarea
            value={value.oneLine}
            onChange={(e) => setValue({ ...value, oneLine: e.target.value })}
            placeholder="User + JTBD + pain + impact, in one sentence."
            style={textareaStyle(100)}
          />
        </div>
      </Card>
    </StepShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16 }}>{children}</div>;
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
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

const inputStyle: React.CSSProperties = {
  marginTop: 8,
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: 12,
  fontFamily: "system-ui",
};

const btnStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 10,
  fontWeight: 700,
  background: "transparent",
  cursor: "pointer",
};

function textareaStyle(minHeight: number): React.CSSProperties {
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
