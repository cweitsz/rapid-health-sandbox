// src/components/StepHelp.tsx
"use client";

import { useState } from "react";

export default function StepHelp(props: {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        background: "transparent",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 900 }}>
          {props.title ?? "Help"}
        </div>
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          style={{
            border: "1px solid #ccc",
            borderRadius: 10,
            padding: "6px 10px",
            fontWeight: 800,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open ? (
        <div style={{ marginTop: 10, lineHeight: 1.5, opacity: 0.9 }}>
          {props.children}
        </div>
      ) : null}
    </div>
  );
}
