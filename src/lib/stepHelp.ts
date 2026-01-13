export type StepHelp = {
  title: string;
  goal: string;
  checklist: string[];
  commonMistakes: string[];
  examples?: { good: string; bad: string };
  glossary?: { term: string; meaning: string }[];
};

export const STEP_HELP: Record<string, StepHelp> = {
  "1-1": {
    title: "1.1 Problem Definition",
    goal: "Lock a single, testable one-line problem: user + job + pain + impact.",
    checklist: [
      "Name ONE primary user (not 'everyone')",
      "State the job-to-be-done in plain language",
      "Describe the pain (what fails, how often)",
      "Describe the impact (time, errors, cost, risk)",
    ],
    commonMistakes: [
      "Writing a solution instead of a problem",
      "Using vague users ('clinicians', 'patients')",
      "No measurable impact",
    ],
    examples: {
      good:
        "New grad physios struggle to interpret stability tests consistently, causing low confidence and inconsistent assessment quality.",
      bad: "We need an app that teaches joint stability testing better.",
    },
    glossary: [
      { term: "Job-to-be-done", meaning: "What the user is trying to accomplish in their workflow." },
      { term: "Impact", meaning: "The measurable consequence if the problem persists." },
    ],
  },

  "1-6": {
    title: "1.6 Problem Validation Interviews/Observation",
    goal: "Collect real evidence that the problem exists and is severe enough to matter.",
    checklist: [
      "Define who you will speak to and why (sample box)",
      "Write 5–8 questions tied to your hypotheses",
      "Plan observation (what you’ll watch, where, when)",
      "Record what you saw/heard (quotes, counts, time)",
      "Note consent and privacy (no identifiers)",
    ],
    commonMistakes: [
      "Asking leading questions ('Would you use…')",
      "Too few interviews then claiming validation",
      "Recording identifiable patient data",
    ],
    examples: {
      good:
        "Observe 2 practical classes + interview 6 students and 2 educators. Capture time-on-task, failure points, and 3 verbatim quotes per participant.",
      bad: "Ask some people if they like the idea.",
    },
    glossary: [
      { term: "Disconfirming evidence", meaning: "Information that proves your hypothesis wrong." },
      { term: "Sampling box", meaning: "A defined set of people you will recruit from (who, where, n)." },
    ],
  },

  // You can fill these in later. Having partial coverage is fine.
};
