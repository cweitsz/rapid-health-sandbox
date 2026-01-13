"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getActiveDossierId, getDossier } from "@/lib/storage";
import { withDossier } from "@/lib/dossierHref";
import { isUuidLike } from "@/lib/dossier";

type Props = {
  intakeHref?: string; // defaults to "/intake"
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

export default function HomeCtas({ intakeHref = "/intake" }: Props) {
  const router = useRouter();

  function onResume() {
    let active: string | null = null;

    try {
      active = getActiveDossierId();
    } catch {
      active = null;
    }

    if (!active || !isUuidLike(active)) {
      router.push(intakeHref);
      return;
    }

    let d: any = null;
    try {
      d = getDossier(active);
    } catch {
      d = null;
    }

    if (!d) {
      router.push(intakeHref);
      return;
    }

    const stepId = d.lastVisitedStepId || "1-1";
    router.push(withDossier(`/steps/${stepId}`, active));
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Link href={intakeHref} style={btnStyle}>
        Start
      </Link>

      <button type="button" style={btnStyle} onClick={onResume}>
        Resume
      </button>

      <Link href="/privacy" style={btnStyle}>
        Read our Privacy Statement
      </Link>
    </div>
  );
}
