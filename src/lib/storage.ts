// src/lib/storage.ts
"use client";

import type { Dossier } from "@/lib/dossier";

// Keys (keep stable so you don't nuke existing local data)
const KEY_ACTIVE = "rhs:activeDossierId";
const KEY_DOSSIER_PREFIX = "rhs:dossier:";

// Legacy active keys used by older code paths (migration)
const LEGACY_ACTIVE_KEYS = [
  "activeDossierId",
  "rhs.activeDossierId",
  "rapidHealthSandbox.activeDossierId",
  "dossier.activeId",
];

function isBrowser() {
  return typeof window !== "undefined";
}

function keyFor(id: string) {
  return `${KEY_DOSSIER_PREFIX}${id}`;
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeJsonStringify(obj: unknown) {
  return JSON.stringify(obj, null, 2);
}

// Safe localStorage helpers (Safari private mode etc. can throw)
function lsGet(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // blocked/unavailable
  }
}
function lsRemove(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // blocked/unavailable
  }
}
function lsKeys(): string[] {
  if (!isBrowser()) return [];
  try {
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) out.push(k);
    }
    return out;
  } catch {
    return [];
  }
}

// Lightweight shape check. Keeps us from loading garbage from storage.
// Slightly tolerant: meta/steps may be absent in older imports, but must be objects if present.
function looksLikeDossier(x: any): x is Dossier {
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.createdAt === "string" &&
    typeof x.updatedAt === "string" &&
    (x.meta == null || typeof x.meta === "object") &&
    (x.steps == null || typeof x.steps === "object")
  );
}

export function setActiveDossierId(id: string | null) {
  const value = (id ?? "").trim();
  if (!value) {
    lsRemove(KEY_ACTIVE);
    return;
  }
  lsSet(KEY_ACTIVE, value);
}

export function getActiveDossierId(): string | null {
  // Canonical key first
  const raw = lsGet(KEY_ACTIVE);
  const v = (raw ?? "").trim();
  if (v) return v;

  // Migrate legacy keys into canonical
  for (const k of LEGACY_ACTIVE_KEYS) {
    const legacyRaw = lsGet(k);
    const legacyVal = (legacyRaw ?? "").trim();
    if (legacyVal) {
      lsSet(KEY_ACTIVE, legacyVal);
      return legacyVal;
    }
  }

  return null;
}

export function upsertDossier(d: Dossier) {
  const id = (d?.id ?? "").trim();
  if (!id) return;

  lsSet(keyFor(id), safeJsonStringify(d));

  // keep active pointer sane
  if (!getActiveDossierId()) setActiveDossierId(id);
}

export function getDossier(id: string): Dossier | null {
  const cleanId = (id ?? "").trim();
  if (!cleanId) return null;

  // Primary location
  const raw = lsGet(keyFor(cleanId));
  if (raw) {
    const d = safeJsonParse<Dossier>(raw);
    return d && looksLikeDossier(d) ? d : null;
  }

  // Fallback: if older code stored by id directly
  const raw2 = lsGet(cleanId);
  if (raw2) {
    const d = safeJsonParse<Dossier>(raw2);
    return d && looksLikeDossier(d) ? d : null;
  }

  return null;
}

export type DossierSummary = {
  id: string;
  projectName: string;
  updatedAt: string;
  createdAt: string;
  oneLineProblem?: string;
  lastVisitedStepId?: string;
};

export function listDossiers(): DossierSummary[] {
  const out: DossierSummary[] = [];

  for (const k of lsKeys()) {
    if (!k.startsWith(KEY_DOSSIER_PREFIX)) continue;

    const raw = lsGet(k);
    if (!raw) continue;

    const d = safeJsonParse<any>(raw);
    if (!looksLikeDossier(d)) continue;

    out.push({
      id: d.id,
      projectName: d.meta?.projectName || "Untitled dossier",
      updatedAt: d.updatedAt,
      createdAt: d.createdAt,
      oneLineProblem: d.meta?.oneLineProblem || "",
      lastVisitedStepId: d.lastVisitedStepId || undefined,
    });
  }

  // newest first
  out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return out;
}

export function deleteDossier(id: string) {
  const cleanId = (id ?? "").trim();
  if (!cleanId) return;

  lsRemove(keyFor(cleanId));
  // also remove fallback key if it exists
  lsRemove(cleanId);

  const active = getActiveDossierId();
  if (active === cleanId) {
    const remaining = listDossiers();
    setActiveDossierId(remaining[0]?.id ?? null);
  }
}

function newUuidLikeId(): string {
  // modern browsers
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // UUID v4-ish fallback (not cryptographically perfect, but UUID-like)
  // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  let dt = Date.now();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    if (c === "x") return r.toString(16);
    return ((r & 0x3) | 0x8).toString(16);
  });
}

function nowIso() {
  return new Date().toISOString();
}

export function createDossier(partialMeta?: Partial<Dossier["meta"]>): Dossier {
  const id = newUuidLikeId();
  const d: Dossier = {
    version: "rhs-dossier-v1",
    id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastVisitedStepId: "1-1",
    meta: {
      projectName: "Untitled dossier",
      organisation: "",
      primaryUser: "",
      setting: "",
      oneLineProblem: "",
      notes: "",
      ...(partialMeta ?? {}),
    },
    steps: {},
  };

  upsertDossier(d);
  setActiveDossierId(id);
  return d;
}

export function createDemoDossier(): Dossier {
  const id = newUuidLikeId();
  const ts = nowIso();

  const d: Dossier = {
    version: "rhs-dossier-v1",
    id,
    createdAt: ts,
    updatedAt: ts,
    lastVisitedStepId: "1-1",
    meta: {
      projectName: "DEMO – Pre-procedure instruction clarity",
      organisation: "Example Imaging Centre",
      primaryUser: "Nursing + admin team",
      setting: "Outpatient imaging / day procedure",
      oneLineProblem:
        "Patients don’t understand or remember pre-procedure instructions, causing delays, rescheduling, and wasted clinic capacity.",
      notes:
        "DEMO ONLY.\n\nContext:\n- Patients receive prep instructions via paper + SMS + verbal handover.\n- Common failure points: fasting rules, medication holds, arrival time, what to bring.\n\nUse this dossier to explore the workflow and evidence capture, not as a real project.",
    },
    steps: {},
  };

  upsertDossier(d);
  setActiveDossierId(id);
  return d;
}

export function exportDossier(id: string): string | null {
  const cleanId = (id ?? "").trim();
  if (!cleanId) return null;

  // Prefer canonical
  const raw = lsGet(keyFor(cleanId));
  if (raw) return raw;

  // Fallback
  return lsGet(cleanId);
}

export function importDossierRaw(
  raw: string
): { ok: true; dossier: Dossier } | { ok: false; error: string } {
  if (!isBrowser()) return { ok: false, error: "Not in browser." };

  const d = safeJsonParse<any>(raw);
  if (!d) return { ok: false, error: "Invalid JSON." };
  if (!looksLikeDossier(d)) return { ok: false, error: "JSON does not look like a dossier." };

  // Ensure required fields exist
  d.version = d.version || "rhs-dossier-v1";
  d.meta = d.meta || {};
  d.meta.projectName = d.meta.projectName || "Imported dossier";
  d.steps = d.steps || {};
  d.updatedAt = nowIso();
  d.createdAt = d.createdAt || nowIso();
  d.lastVisitedStepId = d.lastVisitedStepId || "1-1";

  upsertDossier(d as Dossier);
  setActiveDossierId(d.id);

  return { ok: true, dossier: d as Dossier };
}

export function downloadTextFile(filename: string, text: string) {
  if (!isBrowser()) return;

  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
