"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dossier } from "@/lib/dossier";
import { nowIso, isUuidLike } from "@/lib/dossier";
import { getDossier, upsertDossier } from "@/lib/storage";

type Options<T> = {
  debounceMs?: number;
  syncMeta?: (d: Dossier, value: T) => void;
};

function buildStepPayload<T>(value: T) {
  const ts = nowIso();

  // If value is a plain-ish object, merge updatedAt into it.
  // Otherwise wrap it so we don't do weird spread behavior on strings/numbers/arrays.
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as any), updatedAt: ts };
  }

  return { value, updatedAt: ts };
}

/**
 * Unwrap stored step payloads safely.
 * - If wrapped primitives/arrays: { value, updatedAt } -> return .value
 * - If stored a merged object (object fields + updatedAt): return as-is
 */
function readStepValue<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if ("value" in obj && "updatedAt" in obj) {
      return obj.value as T;
    }
  }

  return raw as T;
}

function safeGetDossier(id: string): Dossier | null {
  try {
    return getDossier(id);
  } catch {
    return null;
  }
}

function safeUpsertDossier(d: Dossier): void {
  try {
    upsertDossier(d);
  } catch {
    // storage unavailable/blocked
  }
}

export function useDossierStep<T>(
  stepId: string,
  defaultValue: T,
  options?: Options<T>
) {
  const sp = useSearchParams();
  const spKey = sp.toString(); // cheap + always current

  const debounceMs = options?.debounceMs ?? 300;

  // Default value can change over time (schema updates, conditional defaults, etc.)
  const defaultRef = useRef<T>(defaultValue);
  useEffect(() => {
    defaultRef.current = defaultValue;
  }, [defaultValue]);

  // Keep syncMeta stable without putting the whole options object in deps
  const syncMetaRef = useRef<Options<T>["syncMeta"]>(options?.syncMeta);
  useEffect(() => {
    syncMetaRef.current = options?.syncMeta;
  }, [options?.syncMeta]);

  const [isReady, setIsReady] = useState(false);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);

  // ✅ Don't read a ref during render; initialize from the actual defaultValue.
  const [value, setValue] = useState<T>(() => defaultValue);

  const [saveMsg, setSaveMsg] = useState<string>("Loading…");

  const timerRef = useRef<number | null>(null);

  // Load dossier + step value whenever dossier changes (query string or stepId changes)
  useEffect(() => {
    // ✅ Prevent autosave from firing during dossier/step switches
    setIsReady(false);
    setSaveMsg("Loading…");

    const params = new URLSearchParams(spKey);
    const qd = params.get("d")?.trim();
    const fromQuery = qd && isUuidLike(qd) ? qd : null;

    // URL is canonical on dossier-bound routes.
    const candidate = fromQuery;

    // Only accept the id if it actually exists in storage
    const d = candidate ? safeGetDossier(candidate) : null;
    const id = d ? candidate : null;

    setDossierId(id);
    setDossier(d);

    const rawExisting = (d?.steps as any)?.[stepId];
    setValue(readStepValue<T>(rawExisting, defaultRef.current));

    setSaveMsg(id ? "Autosave on" : "No dossier selected");
    setIsReady(true);
  }, [spKey, stepId]);

  // Debounced autosave for step value
  useEffect(() => {
    if (!isReady) return;
    if (!dossierId) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = window.setTimeout(() => {
      const d = safeGetDossier(dossierId);
      if (!d) {
        setSaveMsg("Autosave unavailable");
        return;
      }

      const payload = buildStepPayload(value);

      d.updatedAt = nowIso();
      d.steps = d.steps ?? {};
      (d.steps as any)[stepId] = payload;

      // resume pointer
      (d as any).lastVisitedStepId = stepId;

      const syncMeta = syncMetaRef.current;
      if (syncMeta) syncMeta(d, value);

      safeUpsertDossier(d);
      setDossier(d);
      setSaveMsg(`Saved ${new Date().toLocaleTimeString()}`);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isReady, value, dossierId, stepId, debounceMs]);

  return { isReady, dossierId, dossier, value, setValue, saveMsg };
}
