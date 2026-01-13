// src/lib/activeDossier.ts

// Update this list to match whatever Intake v2 uses.
// The function will try them in order.
const ACTIVE_DOSSIER_ID_KEYS = [
  "activeDossierId",
  "rhs.activeDossierId",
  "rapidHealthSandbox.activeDossierId",
  "dossier.activeId",
];

export function getActiveDossierIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  for (const key of ACTIVE_DOSSIER_ID_KEYS) {
    const raw = window.localStorage.getItem(key);
    const value = (raw ?? "").trim();
    if (value) return value;
  }

  return null;
}
