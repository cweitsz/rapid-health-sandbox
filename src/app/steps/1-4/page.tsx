"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type MetricType = "Time" | "Error" | "Adoption" | "Conversion" | "Cost" | "Risk" | "Satisfaction" | "Other";
type Confidence = "Low" | "Medium" | "High";

type MetricSpec = {
  name: string;
  type: MetricType;
  definition: string;
  unit: string;

  instrument: string; // tool/source (audit, timestamps, observation sheet, etc.)
  collection: string; // who collects + where (role + system/context)
  frequency: string; // cadence

  baseline: string;
  baselineConfidence: Confidence;
  baselineAssumption: string;

  target: string;
  window: string; // time window + sample framing
};

type GuardrailSpec = {
  metric: string;
  threshold: string;
  why: string;
  detection: string;
};

type FeasibilityCheck = {
  noBuild: boolean;
  within7Days: boolean;
  repeatable: boolean;
};

type MeasurementPlan = {
  ownerRole: string;
  dataSource: string;
  cadence: string;
  sample: string;
  whereStored: string;
  decisionRule: string;
};

type Step14Payload = {
  version: "1.4-v2";
  leadMetric1: MetricSpec;
  leadMetric2: MetricSpec;
  guardrails: GuardrailSpec[];
  feasibility: FeasibilityCheck;
  plan: MeasurementPlan;
  updatedAt?: string;
};

const STEP_ID = "1-4";

const DEFAULT_METRIC: MetricSpec = {
  name: "",
  type: "Other",
  definition: "",
  unit: "",
  instrument: "",
  collection: "",
  frequency: "",
  baseline: "",
  baselineConfidence: "Low",
  baselineAssumption: "",
  target: "",
  window: "",
};

const DEFAULT_GUARDRAIL: GuardrailSpec = {
  metric: "",
  threshold: "",
  why: "",
  detection: "",
};

const DEFAULT_PAYLOAD: Step14Payload = {
  version: "1.4-v2",
  leadMetric1: { ...DEFAULT_METRIC },
  leadMetric2: { ...DEFAULT_METRIC },
  guardrails: [{ ...DEFAULT_GUARDRAIL }],
  feasibility: { noBuild: false, within7Days: false, repeatable: false },
  plan: {
    ownerRole: "",
    dataSource: "",
    cadence: "",
    sample: "",
    whereStored: "",
    decisionRule: "",
  },
};

function isObject(x: unknown): x is Record<string, any> {
  return typeof x === "object" && x !== null;
}

function clampGuardrails(arr: unknown): GuardrailSpec[] {
  if (!Array.isArray(arr)) return [{ ...DEFAULT_GUARDRAIL }];

  const cleaned = arr
    .filter(isObject)
    .map((g) => ({
      metric: String(g.metric ?? ""),
      threshold: String(g.threshold ?? ""),
      why: String(g.why ?? ""),
      detection: String(g.detection ?? ""),
    }));

  return cleaned.length ? cleaned : [{ ...DEFAULT_GUARDRAIL }];
}

function normalizeMetric(raw: any): MetricSpec {
  // Supports both v0.1 and v0.2-ish shapes
  const name = String(raw?.name ?? "");
  const baseline = String(raw?.baseline ?? "");
  const target = String(raw?.target ?? "");
  const window = String(raw?.window ?? "");
  const howMeasured = String(raw?.howMeasured ?? "");

  const typeRaw = String(raw?.type ?? "Other") as MetricType;
  const type: MetricType =
    typeRaw === "Time" ||
    typeRaw === "Error" ||
    typeRaw === "Adoption" ||
    typeRaw === "Conversion" ||
    typeRaw === "Cost" ||
    typeRaw === "Risk" ||
    typeRaw === "Satisfaction" ||
    typeRaw === "Other"
      ? typeRaw
      : "Other";

  const confRaw = String(raw?.baselineConfidence ?? "Low") as Confidence;
  const baselineConfidence: Confidence = confRaw === "Low" || confRaw === "Medium" || confRaw === "High" ? confRaw : "Low";

  return {
    name,
    type,
    definition: String(raw?.definition ?? ""),
    unit: String(raw?.unit ?? ""),
    instrument: String(raw?.instrument ?? howMeasured ?? ""),
    collection: String(raw?.collection ?? ""),
    frequency: String(raw?.frequency ?? window ?? ""),
    baseline,
    baselineConfidence,
    baselineAssumption: String(raw?.baselineAssumption ?? (baseline ? "If estimate: note how you’ll confirm next week." : "")),
    target,
    window,
  };
}

function migrateToV2(raw: any): Step14Payload {
  // If already v2, just normalize shallowly
  if (isObject(raw) && raw.version === "1.4-v2") {
    return {
      version: "1.4-v2",
      leadMetric1: normalizeMetric(raw.leadMetric1),
      leadMetric2: normalizeMetric(raw.leadMetric2),
      guardrails: clampGuardrails(raw.guardrails),
      feasibility: {
        noBuild: Boolean(raw?.feasibility?.noBuild ?? false),
        within7Days: Boolean(raw?.feasibility?.within7Days ?? false),
        repeatable: Boolean(raw?.feasibility?.repeatable ?? false),
      },
      plan: {
        ownerRole: String(raw?.plan?.ownerRole ?? ""),
        dataSource: String(raw?.plan?.dataSource ?? ""),
        cadence: String(raw?.plan?.cadence ?? ""),
        sample: String(raw?.plan?.sample ?? ""),
        whereStored: String(raw?.plan?.whereStored ?? ""),
        decisionRule: String(raw?.plan?.decisionRule ?? ""),
      },
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    };
  }

  // v0.1 shape fallback:
  const leadMetric1 = normalizeMetric(raw?.leadMetric1 ?? {});
  const leadMetric2 = normalizeMetric(raw?.leadMetric2 ?? {});

  // v0.1 had guardrails as string
  const guardrailsStr = isObject(raw) ? String(raw.guardrails ?? "") : "";
  const migratedGuardrails: GuardrailSpec[] = guardrailsStr.trim()
    ? [
        {
          metric: guardrailsStr,
          threshold: "",
          why: "",
          detection: "",
        },
      ]
    : [{ ...DEFAULT_GUARDRAIL }];

  // v0.1 had measurementPlan string
  const mp = isObject(raw) ? String(raw.measurementPlan ?? "") : "";

  return {
    version: "1.4-v2",
    leadMetric1,
    leadMetric2,
    guardrails: migratedGuardrails,
    feasibility: { noBuild: false, within7Days: false, repeatable: false },
    plan: {
      ownerRole: "",
      dataSource: "",
      cadence: "",
      sample: "",
      whereStored: "",
      decisionRule: mp,
    },
  };
}

export default function Step14Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<any>(STEP_ID, DEFAULT_PAYLOAD);

  const didMigrateRef = useRef(false);

  // One-time migration for existing dossiers using v0.1 payload shape
  useEffect(() => {
    if (!isReady) return;
    if (!dossierId || !dossier) return;
    if (didMigrateRef.current) return;

    const v = value;
    const needsMigration = !isObject(v) || v.version !== "1.4-v2";
    if (needsMigration) {
      didMigrateRef.current = true;
      const migrated = migrateToV2(v);
      setValue(migrated);
      return;
    }

    // also normalize missing nested bits to avoid runtime undefined
    const normalized = migrateToV2(v);
    didMigrateRef.current = true;
    setValue(normalized);
  }, [isReady, dossierId, dossier, value, setValue]);

  if (!isReady) return <Loading />;
  if (!dossierId || !dossier) return <NoDossier />;

  const v2: Step14Payload = migrateToV2(value);

  const feasibilityPass = v2.feasibility.noBuild && v2.feasibility.within7Days && v2.feasibility.repeatable;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.4: Measurable Indicators"
      subtitle="Define 2 lead metrics you can measure next week, with baselines, targets, guardrails, and a measurement plan."
      dossierId={dossierId}
      dossierName={dossier.meta?.projectName}
      saveMsg={saveMsg}
    >
      <StepHelp title="How to fill this in">
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Pick <strong>2 lead metrics</strong> you can measure next week without building new infrastructure.
            If it’s not measurable in 7 days, it’s not a metric. It’s a diary entry.
          </div>

          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>
              <strong>Lead metric</strong> = early signal (minutes, completion %, error count, handoffs, drop-off).
            </li>
            <li>
              <strong>Good format:</strong> Unit + denominator + time window (and sample size).
            </li>
            <li>
              <strong>Baseline:</strong> what’s true today. If it’s a guess, label it and state how you’ll confirm.
            </li>
            <li>
              <strong>Guardrails:</strong> what must not get worse (time burden, errors, safety, satisfaction) with thresholds.
            </li>
            <li>
              <strong>Feasibility:</strong> no-build, measurable in 7 days, repeatable by two people.
            </li>
          </ul>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <strong>Done looks like:</strong> 2 metric spec cards + at least 1 guardrail + feasibility passed + a concrete data plan.
          </div>
        </div>
      </StepHelp>

      <Card>
        <h3 style={h3}>Lead metric 1</h3>
        <MetricEditor
          value={v2.leadMetric1}
          onChange={(m) => setValue({ ...v2, leadMetric1: m })}
        />

        <div style={{ height: 14 }} />

        <h3 style={h3}>Lead metric 2</h3>
        <MetricEditor
          value={v2.leadMetric2}
          onChange={(m) => setValue({ ...v2, leadMetric2: m })}
        />
      </Card>

      <Card>
        <h3 style={h3}>Guardrails</h3>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
          What must <strong>not</strong> get worse while you chase the lead metrics. Add thresholds if you want this to be real.
        </div>

        <GuardrailsEditor
          value={v2.guardrails}
          onChange={(gs) => setValue({ ...v2, guardrails: gs })}
        />
      </Card>

      <Card>
        <h3 style={h3}>Measurement feasibility check</h3>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
          If this fails, your metrics aren’t ready. Which is annoying, but cheaper than delusion.
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <CheckboxRow
            label="No-build: can measure without building product"
            checked={v2.feasibility.noBuild}
            onChange={(b) => setValue({ ...v2, feasibility: { ...v2.feasibility, noBuild: b } })}
          />
          <CheckboxRow
            label="Measurable within 7 days"
            checked={v2.feasibility.within7Days}
            onChange={(b) => setValue({ ...v2, feasibility: { ...v2.feasibility, within7Days: b } })}
          />
          <CheckboxRow
            label="Repeatable: two people would measure the same way"
            checked={v2.feasibility.repeatable}
            onChange={(b) => setValue({ ...v2, feasibility: { ...v2.feasibility, repeatable: b } })}
          />
        </div>

        <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
          <strong>Status:</strong> {feasibilityPass ? "✅ Pass" : "⚠ Fix before you trust these metrics"}
        </div>
      </Card>

      <Card>
        <h3 style={h3}>Measurement plan</h3>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
          Who measures, where the data comes from, how often, sample size, storage, and the decision rule.
        </div>

        <div style={panelStyle}>
          <Field
            label="Owner (role)"
            value={v2.plan.ownerRole}
            onChange={(x) => setValue({ ...v2, plan: { ...v2.plan, ownerRole: x } })}
            placeholder="e.g. Clinician lead / Practice manager / Student / Research assistant"
          />

          <Field
            label="Data source / instrument"
            value={v2.plan.dataSource}
            onChange={(x) => setValue({ ...v2, plan: { ...v2.plan, dataSource: x } })}
            placeholder="e.g. timestamp logs, audit checklist, observation sheet, spreadsheet count"
          />

          <div style={rowStyle}>
            <Field
              label="Cadence"
              value={v2.plan.cadence}
              onChange={(x) => setValue({ ...v2, plan: { ...v2.plan, cadence: x } })}
              placeholder="e.g. daily, weekly, per session"
            />
            <Field
              label="Sample"
              value={v2.plan.sample}
              onChange={(x) => setValue({ ...v2, plan: { ...v2.plan, sample: x } })}
              placeholder="e.g. n=10 cases next week, first 10 intakes"
            />
          </div>

          <Field
            label="Where stored"
            value={v2.plan.whereStored}
            onChange={(x) => setValue({ ...v2, plan: { ...v2.plan, whereStored: x } })}
            placeholder="e.g. local dossier JSON, spreadsheet, notes (no identifiers)"
          />

          <Area
            label="Decision rule"
            value={v2.plan.decisionRule}
            onChange={(x) => setValue({ ...v2, plan: { ...v2.plan, decisionRule: x } })}
            placeholder="e.g. If metric 1 baseline→target doesn’t move by (date), run one iteration; if still flat after iteration 2, Stop."
            minH={120}
          />
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          Tip: In "Decision Rule", be concrete and take time to re-read what you've written, don't just say Go because you feel like it!
        </div>
      </Card>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        Take your time to really do this step well. It links directly to 1.6 to save you time and energy!
      </div>
    </StepShell>
  );
}

function MetricEditor(props: { value: MetricSpec; onChange: (v: MetricSpec) => void }) {
  const v = props.value ?? { ...DEFAULT_METRIC };

  return (
    <div style={panelStyle}>
      <Field
        label="Metric name"
        value={v.name}
        onChange={(x) => props.onChange({ ...v, name: x })}
        placeholder="e.g. % referrals triaged within 24h (n=20/week)"
      />

      <SelectField
        label="Type"
        value={v.type}
        onChange={(x) => props.onChange({ ...v, type: x as MetricType })}
        options={["Time", "Error", "Adoption", "Conversion", "Cost", "Risk", "Satisfaction", "Other"]}
      />

      <Area
        label="Definition"
        value={v.definition}
        onChange={(x) => props.onChange({ ...v, definition: x })}
        placeholder="What exactly is counted/timed? What’s the denominator? What’s included/excluded?"
        minH={90}
      />

      <div style={rowStyle}>
        <Field
          label="Unit"
          value={v.unit}
          onChange={(x) => props.onChange({ ...v, unit: x })}
          placeholder="e.g. minutes, %, count, $, incidents"
        />
        <Field
          label="Window / sample framing"
          value={v.window}
          onChange={(x) => props.onChange({ ...v, window: x })}
          placeholder="e.g. 5-day window, n=10 cases, next week"
        />
      </div>

      <Field
        label="Instrument (How you'll measure it)"
        value={v.instrument}
        onChange={(x) => props.onChange({ ...v, instrument: x })}
        placeholder="e.g. timestamps, audit checklist, manual count, observation sheet"
      />

      <Field
        label="Collection method (who + where)"
        value={v.collection}
        onChange={(x) => props.onChange({ ...v, collection: x })}
        placeholder="e.g. Practice manager audits in Cliniko; student self-times on phone"
      />

      <Field
        label="Frequency"
        value={v.frequency}
        onChange={(x) => props.onChange({ ...v, frequency: x })}
        placeholder="e.g. daily, weekly, per session"
      />

      <div style={rowStyle}>
        <Field
          label="Baseline"
          value={v.baseline}
          onChange={(x) => props.onChange({ ...v, baseline: x })}
          placeholder="e.g. 40% (audit last 20) or ~12 min (estimate)"
        />
        <Field
          label="Target (next week / defined window)"
          value={v.target}
          onChange={(x) => props.onChange({ ...v, target: x })}
          placeholder="e.g. 70% next week OR 6 min within 2 weeks"
        />
      </div>

      <div style={rowStyle}>
        <SelectField
          label="Baseline confidence"
          value={v.baselineConfidence}
          onChange={(x) => props.onChange({ ...v, baselineConfidence: x as Confidence })}
          options={["Low", "Medium", "High"]}
        />
        <Field
          label="Baseline assumption"
          value={v.baselineAssumption}
          onChange={(x) => props.onChange({ ...v, baselineAssumption: x })}
          placeholder="If estimate: why, and how you’ll confirm next week"
        />
      </div>
    </div>
  );
}

function GuardrailsEditor(props: { value: GuardrailSpec[]; onChange: (v: GuardrailSpec[]) => void }) {
  const list = Array.isArray(props.value) && props.value.length ? props.value : [{ ...DEFAULT_GUARDRAIL }];

  function updateAt(i: number, patch: Partial<GuardrailSpec>) {
    const next = list.map((g, idx) => (idx === i ? { ...g, ...patch } : g));
    props.onChange(next);
  }

  function add() {
    props.onChange([...list, { ...DEFAULT_GUARDRAIL }]);
  }

  function remove(i: number) {
    const next = list.filter((_, idx) => idx !== i);
    props.onChange(next.length ? next : [{ ...DEFAULT_GUARDRAIL }]);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {list.map((g, i) => (
        <div key={i} style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Guardrail {i + 1}</div>
            <button type="button" style={miniBtnStyle} onClick={() => remove(i)}>
              Remove
            </button>
          </div>

          <Field
            label="Guardrail metric"
            value={g.metric}
            onChange={(x) => updateAt(i, { metric: x })}
            placeholder="e.g. Clinician/admin time per case"
          />

          <Field
            label="Threshold"
            value={g.threshold}
            onChange={(x) => updateAt(i, { threshold: x })}
            placeholder="e.g. must not increase by > +2 min, or must stay ≥ 7/10"
          />

          <Area
            label="Why it matters"
            value={g.why}
            onChange={(x) => updateAt(i, { why: x })}
            placeholder="What breaks if this gets worse?"
            minH={70}
          />

          <Field
            label="How detected"
            value={g.detection}
            onChange={(x) => updateAt(i, { detection: x })}
            placeholder="e.g. weekly audit, incident log, short survey, observation"
          />
        </div>
      ))}

      <button type="button" style={btnStyle} onClick={add}>
        + Add guardrail
      </button>
    </div>
  );
}

function CheckboxRow(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        style={{ width: 18, height: 18 }}
      />
      <span style={{ fontSize: 13, opacity: 0.9 }}>{props.label}</span>
    </label>
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
  return <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16, marginTop: 14 }}>{children}</div>;
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

function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 700, display: "block" }}>{props.label}</label>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)} style={selectStyle}>
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
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

const h3: CSSProperties = { marginTop: 0, marginBottom: 10, fontSize: 16, fontWeight: 800 };

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

const selectStyle: CSSProperties = {
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

const btnStyle: CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  background: "transparent",
  cursor: "pointer",
};

const miniBtnStyle: CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ccc",
  borderRadius: 10,
  fontWeight: 800,
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
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
