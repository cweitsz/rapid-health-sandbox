"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { STEP_HELP } from "@/lib/stepHelp";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function getStepIdFromPath(pathname: string): string | null {
  // /steps/1-4 -> "1-4"
  if (!pathname.startsWith("/steps/")) return null;
  const parts = pathname.split("/").filter(Boolean);
  return parts[1] || null;
}

export default function StepsChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const stepId = useMemo(() => getStepIdFromPath(pathname), [pathname]);

  const help = stepId ? STEP_HELP[stepId] : null;

  const storageKey = stepId ? `rhs:helpOpen:${stepId}:v1` : null;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    const v = safeGet(storageKey);
    // Default: open if we've never seen this step before
    setOpen(v == null ? true : v === "1");
  }, [storageKey]);

  if (!help) return <>{children}</>;

  return (
    <>
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #eee",
          fontFamily: "system-ui",
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900 }}>{help.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{help.goal}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !open;
                setOpen(next);
                if (storageKey) safeSet(storageKey, next ? "1" : "0");
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 10,
                fontWeight: 800,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {open ? "Hide guidance" : "Show guidance"}
            </button>
          </div>

          {open ? (
            <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 12, padding: 12, background: "white" }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Checklist</div>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {help.checklist.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Common mistakes</div>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {help.commonMistakes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                {help.examples ? (
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Examples</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.8 }}>Good</div>
                        <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{help.examples.good}</div>
                      </div>
                      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.8 }}>Bad</div>
                        <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{help.examples.bad}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {help.glossary?.length ? (
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Glossary</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {help.glossary.map((g) => (
                        <div key={g.term} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
                          <div style={{ fontWeight: 900 }}>{g.term}</div>
                          <div style={{ marginTop: 4, opacity: 0.85 }}>{g.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {children}
    </>
  );
}
