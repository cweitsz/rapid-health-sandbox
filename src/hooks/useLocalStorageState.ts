"use client";

import { useEffect, useRef, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  opts?: { debounceMs?: number }
) {
  const debounceMs = opts?.debounceMs ?? 250;

  const [value, setValue] = useState<T>(initialValue);
  const loadedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // Load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw));
    } catch {
      // ignore
    } finally {
      loadedRef.current = true;
    }
  }, [key]);

  // Save with debounce
  useEffect(() => {
    if (!loadedRef.current) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [key, value, debounceMs]);

  return [value, setValue] as const;
}

