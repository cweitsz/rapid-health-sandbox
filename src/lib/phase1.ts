export const PHASE1_STEPS = [
  { id: "1-1", title: "Problem Definition" },
  { id: "1-2", title: "Stakeholder & Owner/Payer Map" },
  { id: "1-3", title: "Workarounds & Status Quo" },
  { id: "1-4", title: "Measurable Indicators" },
  { id: "1-5", title: "Disconfirming Hypotheses" },
  { id: "1-6", title: "Problem Validation Interviews/Observation" },
  { id: "1-7", title: "Before/After & Solution Hypothesis" },
  { id: "1-8", title: "Alternatives Scan" },
  { id: "1-9", title: "Value Hook" },
  { id: "1-10", title: "Gate Review" },
] as const;

export type Phase1StepId = (typeof PHASE1_STEPS)[number]["id"];

export function getPrevStepId(stepId: string): Phase1StepId | null {
  const idx = PHASE1_STEPS.findIndex((s) => s.id === stepId);
  if (idx <= 0) return null;
  return PHASE1_STEPS[idx - 1].id;
}

export function getNextStepId(stepId: string): Phase1StepId | null {
  const idx = PHASE1_STEPS.findIndex((s) => s.id === stepId);
  if (idx < 0 || idx >= PHASE1_STEPS.length - 1) return null;
  return PHASE1_STEPS[idx + 1].id;
}
