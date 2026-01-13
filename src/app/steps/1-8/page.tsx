"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type Step18Payload = {
  doNothing: string;
  directCompetitors: string;
  adjacentAlternatives: string;
  internalAlternatives: string;
  whyYouWin: string;
  updatedAt?: string;
};

const STEP_ID = "1-8";

export default function Step18Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step18Payload>(
    STEP_ID,
    {
      doNothing: "",
      directCompetitors: "",
      adjacentAlternatives: "",
      internalAlternatives: "",
      whyYouWin: "",
    }
  );

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.8: Alternatives Scan"
      subtitle="List competing/adjacent options, including 'do nothing'."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
     <StepHelp title="How to fill this in">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
            You’re not competing with “competitors”. You’re competing with <strong>whatever already gets the job done</strong>,
            including “do nothing” and “we built a spreadsheet”.
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
                <strong>Do nothing:</strong> Write it like a real option. Why people tolerate the pain (habit, low frequency, no budget, low risk).
            </li>
            <li>
                <strong>Direct competitors:</strong> Same job, same buyer. Include <em>humans-for-hire</em> (consultants, assistants, agencies).
            </li>
            <li>
                <strong>Adjacent alternatives:</strong> Partial substitutes (templates, forms, AI tools, checklists, generic platforms).
            </li>
            <li>
                <strong>Internal alternatives:</strong> Process changes, training, triage rules, hiring, internal tooling.
            </li>
            <li>
                <strong>Why you win:</strong> 1–2 concrete advantages tied to metrics (time saved, error reduced, completion increased).
                “Better UX” is not a strategy.
            </li>
            </ul>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Format to use (copy/paste per alternative)</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                <strong>Name:</strong> ___
                </li>
                <li>
                <strong>Who uses it:</strong> ___ (role + context)
                </li>
                <li>
                <strong>What it replaces:</strong> ___ (which step in the workflow)
                </li>
                <li>
                <strong>Why it wins today:</strong> ___ (cheap / fast / trusted / mandated / already installed)
                </li>
                <li>
                <strong>Why it fails / gaps:</strong> ___ (manual work, errors, poor fit, compliance risk, doesn’t scale)
                </li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Done looks like:</strong> 3–6 real alternatives listed with why they win, plus your 1–2 metric-linked advantages.
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Devil’s-advocate check: if “do nothing” isn’t described as a real choice, you’re underestimating your hardest competitor.
            </div>
        </div>
        </StepHelp>


      <Card>
        <Area
          label="Do nothing (status quo)"
          value={value.doNothing}
          onChange={(v) => setValue({ ...value, doNothing: v })}
          placeholder={
            "Describe the status quo like a real competing option.\n" +
            "- Why do they tolerate it?\n" +
            "- When does it *not* hurt enough to change?\n" +
            "- What’s the hidden benefit (no cost, no training, no risk)?\n" +
            "Example:\n" +
            "They tolerate it because it only happens weekly and the workaround takes 5 minutes."
            }
        />
        <Area
          label="Direct competitors"
          value={value.directCompetitors}
          onChange={(v) => setValue({ ...value, directCompetitors: v })}
          placeholder={
            "List same-job, same-buyer options.\n" +
            "Use one block per competitor:\n" +
            "Name:\nWho uses it:\nWhat it replaces:\nWhy it wins today:\nWhy it fails/gaps:\n" +
            "Include humans-for-hire too (consultants, assistants, agencies)."
            }
        />
        <Area
          label="Adjacent alternatives"
          value={value.adjacentAlternatives}
          onChange={(v) => setValue({ ...value, adjacentAlternatives: v })}
          placeholder={
            "Partial substitutes that remove part of the pain.\n" +
            "Examples: templates, forms, generic platforms, AI tools, checklists.\n" +
            "Use the same block format:\n" +
            "Name:\nWho uses it:\nWhat it replaces:\nWhy it wins today:\nWhy it fails/gaps:"
            }
        />
        <Area
          label="Internal alternatives"
          value={value.internalAlternatives}
          onChange={(v) => setValue({ ...value, internalAlternatives: v })}
          placeholder={
            "DIY options the organisation can do instead of buying/building.\n" +
            "- Process change (e.g. triage rule)\n" +
            "- Training / scripting\n" +
            "- Hiring / role redesign\n" +
            "- Internal tooling / spreadsheet\n" +
            "For each: what it replaces + why it’s attractive + where it breaks."
            }
        />
        <Area
          label="Why you win (differentiation)"
          value={value.whyYouWin}
          onChange={(v) => setValue({ ...value, whyYouWin: v })}
          placeholder={
            "Pick 1–2 concrete advantages tied to a metric from Step 1.4.\n" +
            "Example structure:\n" +
            "- We win because we reduce ___ from __ to __ within __ (measured by ___).\n" +
            "- We win because we remove ___ workflow step, saving ~__ min per case.\n" +
            "Also note what you *won’t* compete on (e.g. price, integrations) if true."
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
