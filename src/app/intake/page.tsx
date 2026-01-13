"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dossier } from "@/lib/dossier";
import { isUuidLike } from "@/lib/dossier";
import { withDossier } from "@/lib/dossierHref";
import {
  createDossier,
  createDemoDossier,
  deleteDossier,
  downloadTextFile,
  exportDossier,
  getActiveDossierId,
  getDossier,
  importDossierRaw,
  listDossiers,
  setActiveDossierId,
  upsertDossier,
  type DossierSummary,
} from "@/lib/storage";

export default function IntakePage() {
  const [isReady, setIsReady] = useState(false);

  const [items, setItems] = useState<DossierSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);

  const [saveMsg, setSaveMsg] = useState<string>("Loading…");

  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string>("");

  // Onboarding banner (local-only)
  const [showOnboarding, setShowOnboarding] = useState(false);

  const timerRef = useRef<number | null>(null);

  function dismissOnboarding() {
    try {
      window.localStorage.setItem("rhs:onboardingDismissed:v1", "1");
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  }

  function resolveActive(list: DossierSummary[], candidate?: string | null) {
    const cand = (candidate ?? "").trim();

    if (cand && isUuidLike(cand)) {
      const d = getDossier(cand);
      if (d) return { aid: cand, dossier: d };
    }

    const fallbackId = list[0]?.id ?? null;
    if (fallbackId) {
      const d2 = getDossier(fallbackId);
      if (d2) return { aid: fallbackId, dossier: d2 };
    }

    return { aid: null, dossier: null as Dossier | null };
  }

  useEffect(() => {
    const list = listDossiers();
    setItems(list);

    const stored = getActiveDossierId();
    const resolved = resolveActive(list, stored);

    if (resolved.aid) setActiveDossierId(resolved.aid);
    setActiveId(resolved.aid);
    setDossier(resolved.dossier);

    setSaveMsg(resolved.aid ? "Autosave on" : "No active dossier");

    // Show onboarding until dismissed
    try {
      const dismissed = window.localStorage.getItem("rhs:onboardingDismissed:v1");
      setShowOnboarding(!dismissed);
    } catch {
      setShowOnboarding(true);
    }

    setIsReady(true);
  }, []);

  function refresh(idOverride?: string | null) {
    const list = listDossiers();
    setItems(list);

    const candidate = idOverride ?? getActiveDossierId();
    const resolved = resolveActive(list, candidate);

    if (resolved.aid) setActiveDossierId(resolved.aid);
    setActiveId(resolved.aid);
    setDossier(resolved.dossier);

    setSaveMsg(resolved.aid ? "Autosave on" : "No active dossier");
  }

  const resumeHref = useMemo(() => {
    if (!activeId) return "/intake";
    const step = (dossier as any)?.lastVisitedStepId || "1-1";
    return withDossier(`/steps/${step}`, activeId);
  }, [activeId, dossier]);

  function onCreateNew() {
    const d = createDossier();
    refresh(d.id);
    setImportMsg("");
  }

  function onCreateDemo() {
  const d = createDemoDossier();
  refresh(d.id);
  setImportMsg("");

  // Don't auto-dismiss onboarding.
  // Let users explicitly dismiss it with the Dismiss button.
}


  function onSwitch(id: string) {
    refresh(id);
    setImportMsg("");
  }

  function onDelete(id: string) {
    const name = items.find((x) => x.id === id)?.projectName || id;
    const ok = window.confirm(`Delete dossier "${name}"?\n\nThis cannot be undone.`);
    if (!ok) return;

    deleteDossier(id);
    refresh();
  }

  function onExport() {
    if (!activeId) return;
    const raw = exportDossier(activeId);
    if (!raw) return;

    const safeName = (dossier?.meta?.projectName || "dossier")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .toLowerCase();

    downloadTextFile(`${safeName}-${activeId}.json`, raw);
  }

  function onImportText() {
    setImportMsg("");
    const res = importDossierRaw(importText);
    if (!res.ok) {
      setImportMsg(res.error);
      return;
    }
    setImportMsg(`Imported: ${res.dossier.meta?.projectName || res.dossier.id}`);
    setImportText("");
    refresh(res.dossier.id);
  }

  function onImportFile(file: File) {
    setImportMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const res = importDossierRaw(raw);
      if (!res.ok) {
        setImportMsg(res.error);
        return;
      }
      setImportMsg(`Imported: ${res.dossier.meta?.projectName || res.dossier.id}`);
      refresh(res.dossier.id);
    };
    reader.readAsText(file);
  }

  // Debounced save of meta edits (NO refresh(activeId) here to avoid save loops)
  useEffect(() => {
    if (!isReady) return;
    if (!activeId) return;
    if (!dossier) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      upsertDossier(dossier);
      setSaveMsg(`Saved ${new Date().toLocaleTimeString()}`);

      // Only refresh summaries so timestamps update in the dropdown,
      // without reloading dossier (which can trigger repeated saves).
      setItems(listDossiers());
    }, 300);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isReady, activeId, dossier]);

  if (!isReady) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Dossier intake</h1>
      <p style={{ marginTop: 8, maxWidth: 760, lineHeight: 1.5 }}>
        Create a project or resume work you have already started.
      </p>

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>{saveMsg}</div>

      {showOnboarding ? (
        <Section title="Getting started">
          <p style={{ marginTop: 8, maxWidth: 760, lineHeight: 1.5 }}>
            This tool helps you validate a problem with evidence.
          </p>

          <ul style={{ marginTop: 30, lineHeight: 1.8 }}>
            <li>Use Sprint A to define the problem and stakeholder reality.</li>
            <li>Use Sprint B to pick metrics and validate with real users.</li>
            <li>Use Sprint C to synthesize findings and decide what to do next.</li>
            <li>Use Review to see completeness and export/share a dossier.</li>
          </ul>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={btnStyle} onClick={onCreateDemo}>
              Load demo dossier
            </button>
            <button type="button" style={btnStyle} onClick={dismissOnboarding}>
              Dismiss
            </button>
          </div>
        </Section>
      ) : null}

      <Section title="Active dossier">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={activeId ?? ""} onChange={(e) => onSwitch(e.target.value)} style={selectStyle}>
            {items.length === 0 ? <option value="">(No dossiers yet)</option> : null}
            {items.map((d) => (
              <option key={d.id} value={d.id}>
                {d.projectName} · {new Date(d.updatedAt).toLocaleDateString()}
              </option>
            ))}
          </select>

          <button type="button" style={btnStyle} onClick={onCreateNew}>
            + New dossier
          </button>
          
          <button type="button" style={btnStyle} onClick={onCreateDemo}>
            + New demo dossier
            </button>


          <Link href={resumeHref} style={linkBtnStyle}>
            Resume →
          </Link>

          <button type="button" style={btnStyle} onClick={onExport} disabled={!activeId}>
            Export JSON
          </button>

          {activeId ? (
            <button type="button" style={dangerBtnStyle} onClick={() => onDelete(activeId)}>
              Delete
            </button>
          ) : null}
        </div>

        {dossier ? (
          <div style={{ marginTop: 14 }}>
            <Grid2>
              <Field
                label="Project name"
                value={dossier.meta?.projectName || ""}
                onChange={(v) => setDossier({ ...dossier, meta: { ...dossier.meta, projectName: v } })}
              />
              <Field
                label="Organisation"
                value={dossier.meta?.organisation || ""}
                onChange={(v) => setDossier({ ...dossier, meta: { ...dossier.meta, organisation: v } })}
              />
              <Field
                label="Primary user"
                value={dossier.meta?.primaryUser || ""}
                onChange={(v) => setDossier({ ...dossier, meta: { ...dossier.meta, primaryUser: v } })}
              />
              <Field
                label="Setting"
                value={dossier.meta?.setting || ""}
                onChange={(v) => setDossier({ ...dossier, meta: { ...dossier.meta, setting: v } })}
              />
            </Grid2>

            <Area
              label="One-line problem (from 1.1)"
              value={dossier.meta?.oneLineProblem || ""}
              onChange={(v) => setDossier({ ...dossier, meta: { ...dossier.meta, oneLineProblem: v } })}
              minH={90}
            />
            <Area
              label="Notes"
              value={dossier.meta?.notes || ""}
              onChange={(v) => setDossier({ ...dossier, meta: { ...dossier.meta, notes: v } })}
              minH={120}
            />
          </div>
        ) : (
          <p style={{ marginTop: 12 }}>No active dossier. Create one.</p>
        )}
      </Section>

      <Section title="Import">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
            }}
          />
          <div style={{ fontSize: 12, opacity: 0.8 }}>{importMsg}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ fontWeight: 800 }}>Paste JSON</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste a dossier JSON here, then import."
            style={textareaStyle(140)}
          />
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={btnStyle} onClick={onImportText} disabled={!importText.trim()}>
              Import pasted JSON
            </button>
            <button
              type="button"
              style={btnStyle}
              onClick={() => {
                setImportText("");
                setImportMsg("");
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </Section>

      <Section title="All dossiers">
        {items.length === 0 ? (
          <p>No dossiers yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((d) => (
              <div key={d.id} style={rowCardStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900 }}>{d.projectName}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    Updated {new Date(d.updatedAt).toLocaleString()} · ID <code>{d.id}</code>
                  </div>
                  {d.oneLineProblem ? (
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>{d.oneLineProblem}</div>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" style={btnStyle} onClick={() => onSwitch(d.id)}>
                    Switch
                  </button>

                  <Link
                    href={withDossier(`/steps/${d.lastVisitedStepId || "1-1"}`, d.id)}
                    style={linkBtnStyle}
                    onClick={() => setActiveDossierId(d.id)}
                  >
                    Resume →
                  </Link>

                  <button type="button" style={dangerBtnStyle} onClick={() => onDelete(d.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{props.title}</h2>
      <div style={{ marginTop: 12 }}>{props.children}</div>
    </div>
  );
}

function Grid2(props: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{props.children}</div>;
}

function Field(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 800, display: "block" }}>{props.label}</label>
      <input value={props.value} onChange={(e) => props.onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

function Area(props: { label: string; value: string; onChange: (v: string) => void; minH?: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 800, display: "block" }}>{props.label}</label>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={textareaStyle(props.minH ?? 110)}
      />
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #ccc",
  minWidth: 340,
  fontFamily: "system-ui",
  background: "transparent",
  color: "inherit",
};

const inputStyle: React.CSSProperties = {
  marginTop: 8,
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: 12,
  fontFamily: "system-ui",
  background: "transparent",
  color: "inherit",
};

function textareaStyle(minHeight: number): React.CSSProperties {
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

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  background: "transparent",
  cursor: "pointer",
};

const dangerBtnStyle: React.CSSProperties = {
  ...btnStyle,
  border: "1px solid #c33",
};

const linkBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  textDecoration: "none",
};

const rowCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 14,
  display: "flex",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
};
