import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <header style={{ paddingTop: 24, paddingBottom: 16 }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, margin: 0 }}>Rapid Health Sandbox</h1>

        {/* Use UL for list items, not <p> with <li> inside it */}
        <ul style={{ marginTop: 10, fontSize: 16, opacity: 0.85, lineHeight: 1.6, paddingLeft: 18 }}>
          <li>
            <strong>A practical validation sprint for early-stage health ideas.</strong>
          </li>
          <li>Define the problem, test it with users, and make a disciplined decision with documented evidence.</li>
          <li>If you want to build something that makes meaningful change, you need to start with a real problem.</li>
        </ul>

        {/* CTAs: all in one row */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/intake" style={primaryBtn}>
              Start / Manage Dossiers
            </Link>

            <Link href="/sprints" style={secondaryBtn}>
              Explore the Sprints
            </Link>

            <Link href="/privacy" style={secondaryBtn}>
              Read our Privacy Statement
            </Link>
          </div>
        </div>
      </header>

      <section style={card}>
        <h2 style={h2}>Who it’s for</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.8, paddingLeft: 18 }}>
          <li>
            People validating an idea who need <strong>evidence-grade decisions</strong>.
          </li>
          <li>Built for: clinicians, educators, and health operators testing new workflows, services, or tools.</li>
          <li>We don&apos;t do &quot;startup inspiration&quot; or a pitch-deck template.</li>
          <li>From spark to proof in a week.</li>
        </ul>
      </section>

      <section style={card}>
        <h2 style={h2}>Why this exists</h2>
        {/* This is NOT a true ordered list. Use UL, unless order matters. */}
        <ul style={{ marginTop: 10, lineHeight: 1.8, paddingLeft: 18 }}>
          <li>
            <strong>Artifacts-first:</strong> every claim ties to something you can show
          </li>
          <li>
            <strong>Decision discipline:</strong> “one iteration” means one, not eight
          </li>
          <li>
            <strong>Workflow-aware:</strong> buyer ≠ user ≠ approver, so we force you to map reality
          </li>
          <li>
            <strong>Local-first:</strong> your data stays in your browser (no account required)
          </li>
        </ul>
      </section>

      <section id="how-it-works" style={card}>
        <h2 style={h2}>How it works</h2>

        <ol style={{ marginTop: 10, lineHeight: 1.8, paddingLeft: 18 }}>
          <li>
            Create a dossier in <strong>Intake</strong>.
          </li>
          <li>Complete Sprint A, B and C with concrete steps.</li>
          <li>
            Use the <strong>Decision Gate Review</strong> to make an informed decision instead of working on ideas that
            don’t matter.
          </li>
          <li>Export your work when you want to share or archive it.</li>
        </ol>

        <div style={{ marginTop: 12, lineHeight: 1.7, opacity: 0.9 }}>
          <div style={{ fontWeight: 900 }}>Typical time</div>
          <ul style={{ marginTop: 8, lineHeight: 1.7, paddingLeft: 18 }}>
            <li>Sprint A: ~45–60 min</li>
            <li>Sprint B: ~60–90 min + user calls</li>
            <li>Sprint C: ~45–60 min</li>
            <li>Most people can finish the writing parts in a day, then gather evidence over a week.</li>
          </ul>
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>What you get</h2>
        <ul style={{ marginTop: 10, lineHeight: 1.8, paddingLeft: 18 }}>
          <li>
            <strong>At the end you’ll have:</strong>
          </li>
          <li>🗣️ A Problem Definition you can repeat in one breath</li>
          <li>👥 A Stakeholder map that includes who pays and who can veto</li>
          <li>📊 Two lead metrics with baselines + measurement plan</li>
          <li>🔎 A short validation plan and captured evidence</li>
          <li>✅/🛑/🔁 A Gate Review score + decision + next actions</li>
          <li>📄 An exportable document of proof your idea has legs (JSON now, PDF later if you want)</li>
        </ul>

        <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/intake" style={primaryBtn}>
            Start Here
          </Link>

          <Link href="/sprints/sprint-a" style={secondaryBtn}>
            Start at Sprint A
          </Link>
        </div>
      </section>

      <footer style={{ marginTop: 28, paddingTop: 14, borderTop: "1px solid #ddd", opacity: 0.8 }}>
        <p style={{ margin: 0, fontSize: 12 }}>
          Note: this tool stores drafts in your browser storage unless you export them.
        </p>
      </footer>
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 16,
  marginTop: 14,
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
};

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ccc",
  fontWeight: 800,
  textDecoration: "none",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontWeight: 700,
  opacity: 0.9,
  textDecoration: "none",
};
