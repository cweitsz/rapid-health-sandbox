// src/lib/dossier.ts

export type DossierMeta = {
  projectName: string;
  organisation: string;
  primaryUser: string;
  setting: string;
  oneLineProblem: string;
  notes: string;
};

export type Dossier = {
  version: string; // e.g. "rhs-dossier-v1"
  id: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Used by Intake v2 "Resume" button
  lastVisitedStepId?: string; // e.g. "1-4"

  meta: DossierMeta;

  // Steps payloads live here (1-1 .. 1-10)
  steps: Record<string, any>;
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function isUuidLike(s: string): boolean {
  // Accepts standard UUID v4-ish shapes. Good enough for local IDs.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export function makeEmptyMeta(overrides?: Partial<DossierMeta>): DossierMeta {
  return {
    projectName: "Untitled dossier",
    organisation: "",
    primaryUser: "",
    setting: "",
    oneLineProblem: "",
    notes: "",
    ...(overrides ?? {}),
  };
}

