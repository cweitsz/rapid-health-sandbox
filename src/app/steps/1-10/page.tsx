"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";
import { exportDossier, downloadTextFile } from "@/lib/storage";

type GateDecision = "go" | "iterate" | "stop";

type Step110Payload = {
  evidenceQuality: number; // 0-10
  severity: number; // 0-10
  willingnessToPay: number; // 0-10
  feasibility: number; // 0-10
  differentiation: number; // 0-10

  artifactsChecklist: {
    step11: boolean;
    step12: boolean;
    step13: boolean;
    step14: boolean;
    step15: boolean;
    step16: boolean;
    step17: boolean;
    step18: boolean;
    step19: boolean;
  };

  decision: GateDecision;
  rationale: string;
  nextActions: string;
  updatedAt?: string;
};

const STEP_ID = "1-10";

export default function Step110Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step110Payload>(
    STEP_ID,
    {
      evidenceQuality: 0,
      severity: 0,
      willingnessToPay: 0,
      feasibility: 0,
      differentiation: 0,
      artifactsChecklist: {
        step11: false,
        step12: false,
        step13: false,
        step14: false,
        step15: false,
        step16: false,
        step17: false,
        step18: false,
        step19: false,
      },
      decision: "iterate",
      rationale: "",
      nextActions: "",
    }
  );

  // Hook-safe: no hooks below conditional returns.
  const total =
    (value.evidenceQuality || 0) +
    (value.severity || 0) +
    (value.willingnessToPay || 0) +
    (value.feasibility || 0) +
    (value.differentiation || 0);

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const did = dossierId;
  const dos = dossier;
  const a = value.artifactsChecklist;

  function exportJson() {
    const raw = exportDossier(did);
    if (!raw) return;

    const safeName = (dos.meta?.projectName || "dossier")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .toLowerCase();

    downloadTextFile(`${safeName}-${did}.json`, raw);
  }

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.10: Gate Review"
      subtitle="Score, decide: Go / One-iteration / Stop. Keep it evidence-first - don't let your own biases creep in."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
        <StepHelp title="How to use this gate without lying to yourself">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
            This is the decision step. Time to put the honesty hat on and evaluate your progress so far.
            If evidence is weak, everything is weak. No exceptions & no free points just because YOU like your idea.
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
                Scores are <strong>0–10</strong>. Use <strong>0 / 5 / 8–10</strong> anchors below so your numbers mean something.
            </li>
            <li>
                <strong>One-iteration</strong> means one tight loop (≤2 days). If you’re on loop #3, call it what it is: <strong>Stop</strong>.
            </li>
            <li>
                The artifacts checklist is “usable evidence exists”, not “I typed text into a box”.
            </li>
            <li>
                Rationale must cite specifics: <strong>counts, quotes, observations</strong>, what moved vs baseline, and what didn’t.
            </li>
            </ul>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Scoring anchors (use these)</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                <strong>Evidence quality:</strong> 0 = none; 5 = some interviews/notes but inconsistent; 8–10 = repeatable pattern + artifacts (quotes, counts, screenshots) + clear pass/fail.
                </li>
                <li>
                <strong>Problem severity:</strong> 0 = mild annoyance; 5 = regular friction with workarounds; 8–10 = frequent + costly/risky + users change behaviour to cope.
                </li>
                <li>
                <strong>Willingness to pay:</strong> 0 = “nice idea”; 5 = interest but unclear budget/owner; 8–10 = buyer named + budget path + urgency + explicit “we’d pay if…”.
                </li>
                <li>
                <strong>Feasibility:</strong> 0 = fantasy; 5 = plausible with caveats; 8–10 = clear scope + constraints handled + simple first version possible fast.
                </li>
                <li>
                <strong>Differentiation:</strong> 0 = copycat; 5 = slightly better; 8–10 = clear unfair advantage tied to workflow + measurable outcome that alternatives can’t match.
                </li>
            </ul>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <strong>Decision rule of thumb</strong>
            <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                <li><strong>Go:</strong> Evidence quality ≥ 7 and total ≥ 35, with no “dealbreaker” constraints.</li>
                <li><strong>One-iteration:</strong> Exactly one missing unknown you can test in ≤2 days.</li>
                <li><strong>Stop:</strong> Evidence quality ≤ 4 after attempts, or buyer/willingness-to-pay is consistently weak, or iteration count exceeds 2.</li>
            </ul>
            </div>
        </div>
        </StepHelp>


      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Rubric (0–10 each)</h3>
          <button type="button" onClick={exportJson} style={btnStyle}>
            Export dossier JSON
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <ScoreInput
            label="Evidence quality"
            value={value.evidenceQuality}
            onChange={(n) => setValue({ ...value, evidenceQuality: n })}
          />
          <ScoreInput
            label="Problem severity"
            value={value.severity}
            onChange={(n) => setValue({ ...value, severity: n })}
          />
          <ScoreInput
            label="Willingness to pay"
            value={value.willingnessToPay}
            onChange={(n) => setValue({ ...value, willingnessToPay: n })}
          />
          <ScoreInput
            label="Feasibility"
            value={value.feasibility}
            onChange={(n) => setValue({ ...value, feasibility: n })}
          />
          <ScoreInput
            label="Differentiation"
            value={value.differentiation}
            onChange={(n) => setValue({ ...value, differentiation: n })}
          />

          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>Total</div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>{total} / 50</div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>{saveMsg}</div>
          </div>
        </div>

        <Divider />

        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Artifacts checklist</h3>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Check
            label="1.1 done"
            checked={a.step11}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step11: x } })}
          />
          <Check
            label="1.2 done"
            checked={a.step12}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step12: x } })}
          />
          <Check
            label="1.3 done"
            checked={a.step13}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step13: x } })}
          />
          <Check
            label="1.4 done"
            checked={a.step14}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step14: x } })}
          />
          <Check
            label="1.5 done"
            checked={a.step15}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step15: x } })}
          />
          <Check
            label="1.6 done"
            checked={a.step16}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step16: x } })}
          />
          <Check
            label="1.7 done"
            checked={a.step17}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step17: x } })}
          />
          <Check
            label="1.8 done"
            checked={a.step18}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step18: x } })}
          />
          <Check
            label="1.9 done"
            checked={a.step19}
            onChange={(x) => setValue({ ...value, artifactsChecklist: { ...a, step19: x } })}
          />
        </div>

        <Divider />

        <Select
          label="Decision"
          value={value.decision}
          onChange={(v) => setValue({ ...value, decision: v as GateDecision })}
          options={[
            { value: "go", label: "Go" },
            { value: "iterate", label: "One-iteration" },
            { value: "stop", label: "Stop" },
          ]}
        />

        <Area
          label="Rationale"
          value={value.rationale}
          onChange={(v) => setValue({ ...value, rationale: v })}
          placeholder={
            "Cite evidence. No vibes.\n\n" +
            "- Top 3 evidence points (quotes/counts/observations):\n" +
            "  1) ___\n" +
            "  2) ___\n" +
            "  3) ___\n\n" +
            "- What moved vs baseline (Step 1.4 metrics): ___\n" +
            "- What did NOT move / surprised you: ___\n" +
            "- Biggest risk still unresolved: ___\n" +
            "- Why this decision (Go / One-iteration / Stop): ___"
            }
        />
        <Area
          label="Next actions"
          value={value.nextActions}
          onChange={(v) => setValue({ ...value, nextActions: v })}
          placeholder={
            "Write actions that a stranger could execute.\n\n" +
            "If GO:\n" +
            "- Build/test next smallest version: ___\n" +
            "- Who/when (dates or next week): ___\n" +
            "- Success criteria (metric + target): ___\n\n" +
            "If ONE-ITERATION (≤2 days, single unknown):\n" +
            "- Unknown to test: ___\n" +
            "- Test method + sample: ___\n" +
            "- Pass threshold: ___\n" +
            "- Fail threshold: ___\n\n" +
            "If STOP:\n" +
            "- What you learned: ___\n" +
            "- What you will NOT do next: ___\n" +
            "- Where to redirect (new user/problem/segment): ___"
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

function Divider() {
  return <div style={{ height: 1, background: "#ddd", margin: "14px 0" }} />;
}

function ScoreInput(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontWeight: 700 }}>{props.label}</label>
      <input
        type="number"
        min={0}
        max={10}
        value={globalThis.Number.isFinite(props.value) ? props.value : 0}
        onChange={(e) => props.onChange(clamp10(parseInt(e.target.value || "0", 10)))}
        style={inputStyle}
      />
    </div>
  );
}

function clamp10(n: number) {
  if (!globalThis.Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <span style={{ fontWeight: 700 }}>{props.label}</span>
    </label>
  );
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

const btnStyle: CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 10,
  fontWeight: 700,
  background: "transparent",
  cursor: "pointer",
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

