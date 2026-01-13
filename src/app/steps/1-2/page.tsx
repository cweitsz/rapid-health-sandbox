"use client";

import Link from "next/link";
import StepShell from "@/components/StepShell";
import StepHelp from "@/components/StepHelp";
import { useDossierStep } from "@/hooks/useDossierStep";

type Step12Payload = {
  primaryUsers: string;
  buyers: string;
  approvers: string;
  influencers: string;
  beneficiaries: string;
  blockers: string;
  notes: string;
  updatedAt?: string;
};

const STEP_ID = "1-2";

export default function Step12Page() {
  const { isReady, dossierId, dossier, value, setValue, saveMsg } = useDossierStep<Step12Payload>(
    STEP_ID,
    {
      primaryUsers: "",
      buyers: "",
      approvers: "",
      influencers: "",
      beneficiaries: "",
      blockers: "",
      notes: "",
    }
  );

  // Prevent hydration mismatch: server + first client render match
  if (!isReady) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!dossierId || !dossier) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>
          No active dossier found. Go to <Link href="/intake">/intake</Link>.
        </p>
      </main>
    );
  }

  const did = dossierId;
  const dos = dossier;

  return (
    <StepShell
      stepId={STEP_ID}
      title="Step 1.2: Stakeholder & Owner/Payer Map"
      subtitle="Map users, buyers, approvers, and who benefits. Concrete roles, not vibes."
      dossierId={did}
      dossierName={dos.meta?.projectName}
      saveMsg={saveMsg}
    >
            <StepHelp title="How to fill this in">
                <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                    This step answers one annoying but important question: <strong>Who has to say yes</strong> for this to exist in the real world.
                    Map the decision chain in roles. If you can’t name the roles, you don’t know the market yet.
                </div>

                <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                    <li>
                    Use <strong>roles</strong> (e.g. “Practice Manager”, “Clinic Owner”, “Head of Dept”, “IT Security”), not individuals.
                    </li>
                    <li>
                    Keep <strong>Primary users</strong> this tight: Who would touch this <em>weekly</em> (or more)?
                    </li>
                    <li>
                    <strong>Buyer/Payer</strong> = Who’s budget actually pays. Not who’s enthusiastic.
                    </li>
                    <li>
                    <strong>Approver</strong> = Who can veto even if the buyer wants it (governance, IT/security, clinical lead, procurement).
                    </li>
                    <li>
                    <strong>Influencers</strong> = Who shifts opinions without signing (respected clinicians, professional bodies, vendors, PHN).
                    </li>
                    <li>
                    <strong>Beneficiaries</strong> = Who gets upside but might never touch it (patients, execs, regulators, other teams).
                    </li>
                    <li>
                    <strong>Blockers/Risks</strong> = List the real “no” reasons in plain language (privacy, workflow time, incentives, trust, change fatigue).
                    </li>
                </ul>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                    <strong>Quick test:</strong> Can you draw a straight line from <em>User → Buyer → Approver</em>? If not, you’re missing a role.
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                    <strong>Example (non-physio):</strong>
                    <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                    <li><strong>Primary users:</strong> Reception staff, clinicians doing intake</li>
                    <li><strong>Buyer/payer (Who's budget pays?):</strong> Practice owner / practice group</li>
                    <li><strong>Approvers (Who can veto?):</strong> Practice manager + IT/security (if any) + vendor-integrations gatekeeper</li>
                    <li><strong>Influencers:</strong> Senior clinician champion, PHN program lead, software vendor partner manager</li>
                    <li><strong>Beneficiaries:</strong> Patients (less repetition), clinicians (cleaner consult), owner (throughput)</li>
                    <li><strong>Blockers/risks:</strong> “Another tool”, privacy concerns, staff time to adopt, integration complexity</li>
                    </ul>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                    <strong>Done looks like:</strong> A stranger could read this and predict (1) who must adopt, (2) who pays, and (3) who can kill the deal.
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                    Sanity check: if <strong>buyer ≠ user</strong>, adoption is the product. Pretending otherwise is how pilots die.
                </div>
                </div>
            </StepHelp>


      <Card>
        <Area
            label="Primary users (who touches it weekly?)"
            value={value.primaryUsers}
            onChange={(v) => setValue({ ...value, primaryUsers: v })}
            placeholder={
            "One role per line.\n" +
            "- Reception staff\n" +
            "- Clinicians doing intake\n" +
            "- Admin team lead"
            }
        />

        <Area
            label="Buyer / payer (whose budget pays?)"
            value={value.buyers}
            onChange={(v) => setValue({ ...value, buyers: v })}
            placeholder={
            "One role per line.\n" +
            "- Practice owner / partners\n" +
            "- Practice manager (budget owner)\n" +
            "- Hospital department budget holder"
            }
        />

        <Area
            label="Approvers (who can veto?)"
            value={value.approvers}
            onChange={(v) => setValue({ ...value, approvers: v })}
            placeholder={
            "One role per line.\n" +
            "- Clinical lead / director\n" +
            "- IT / Security (if applicable)\n" +
            "- Governance / procurement"
            }
        />

        <Area
            label="Influencers (who sways the decision?)"
            value={value.influencers}
            onChange={(v) => setValue({ ...value, influencers: v })}
            placeholder={
            "One role per line.\n" +
            "- Respected clinician champion\n" +
            "- Professional body / college\n" +
            "- PHN program lead\n" +
            "- Vendor partner manager"
            }
        />

        <Area
            label="Beneficiaries (who benefits even if they don’t use it?)"
            value={value.beneficiaries}
            onChange={(v) => setValue({ ...value, beneficiaries: v })}
            placeholder={
            "One role per line.\n" +
            "- Patients\n" +
            "- Clinicians\n" +
            "- Practice owner / exec\n" +
            "- Quality/safety team"
            }
        />

        <Area
            label="Blockers / risks (who says no, and why?)"
            value={value.blockers}
            onChange={(v) => setValue({ ...value, blockers: v })}
            placeholder={
            "One blocker per line. Plain language.\n" +
            "- \"We don’t have time to train staff\"\n" +
            "- Privacy / data handling concerns\n" +
            "- Integration too hard\n" +
            "- No clear incentive to change"
            }
        />

        <Area
            label="Notes"
            value={value.notes}
            onChange={(v) => setValue({ ...value, notes: v })}
            placeholder={
            "Anything else that matters.\n" +
            "Examples: procurement constraints, contract lengths, existing vendor lock-in, timing (renewals), internal politics."
            }
            minH={140}
        />
        </Card>

    </StepShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16 }}>{children}</div>;
}

function Area(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minH?: number;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 700 }}>{props.label}</label>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={textareaStyle(props.minH ?? 110)}
      />
    </div>
  );
}

function textareaStyle(minHeight: number): React.CSSProperties {
  return {
    marginTop: 8,
    width: "100%",
    minHeight,
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 12,
    fontFamily: "system-ui",
  };
}
