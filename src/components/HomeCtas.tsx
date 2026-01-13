"use client";

import Link from "next/link";

type Props = {
  intakeHref?: string; // unused now, kept so app/page.tsx doesn't break
};

const btnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 16px",
  border: "1px solid #ccc",
  borderRadius: 12,
  fontWeight: 800,
  textDecoration: "none",
  cursor: "pointer",
  background: "transparent",
  color: "inherit",
};

export default function HomeCtas(_props: Props) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Link href="/privacy" style={btnStyle}>
        Read our Privacy Statement
      </Link>
    </div>
  );
}
