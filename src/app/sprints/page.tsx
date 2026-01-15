import Link from "next/link";

export default function SprintsIndexPage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <header style={{ paddingTop: 24, paddingBottom: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Sprints</h1>

        <ul style={{ marginTop: 10, maxWidth: 820, lineHeight: 1.6, opacity: 0.9 }}>
          <li>This page is a quick overview of the framework. </li>
          <li>If you want to actually complete the work, create a
          new project by clicking <strong>Go to Intake</strong></li>
          <li>Your progress can autosave in your browser and you can tinker as you go!</li>
        </ul>

        <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" style={secondaryBtn}>
            ← Back to Home
          </Link>
          <Link href="/intake" style={secondaryBtn}>
            Start / Manage My Projects
          </Link>
        </div>
      </header>

      <section style={card}>
        <h2 style={h2}>Sprint A: Define & Map</h2>
        <ul style={ul}>
        <li>Clarify <strong>what</strong> problem you’re solving, for <strong>whom</strong>, and <strong>why it matters</strong>.</li>
        <li>Map the real-world stakeholders and the status quo so you're building something people <strong>actually need</strong></li>
        </ul>

        <div style={subhead}>Steps</div>
        <ul style={ul}>
          <li>
            <strong>1.1</strong> Problem Definition
          </li>
          <li>
            <strong>1.2</strong> Stakeholder & Owner/Payer Map
          </li>
          <li>
            <strong>1.3</strong> Workarounds & Status Quo
          </li>
        </ul>

        <div style={note}>
          Typical time: <strong>~45–60 min</strong>
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Sprint B: Quantify & Test</h2>
        <ul style={ul}>
          <li>Choose <strong>measurable signals</strong> and run real-world checks.</li>
          <li>This is translates good ideas into data you can show investors.</li>
        </ul>

        <div style={subhead}>Steps</div>
        <ul style={ul}>
          <li>
            <strong>1.4</strong> Measurable Indicators
          </li>
          <li>
            <strong>1.5</strong> Disconfirming Hypotheses
          </li>
          <li>
            <strong>1.6</strong> Problem Validation Interviews/Observation
          </li>
        </ul>

        <div style={note}>
          Typical time: <strong>~60–90 min</strong> (plus user calls)
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Sprint C: Synthesize & Decide</h2>
        <ul style={ul}>
          <li>Turn the evidence you've collected in Sprint B into a simple decision - GO | STOP | ITERATE.</li>
          <li>Define what changes with your solution, scan alternatives, state a clear <strong>value hook</strong> you can pitch.</li>
          <li>Review your work to uncover missing links or areas you need to explore more.</li>
        </ul>

        <div style={subhead}>Steps</div>
        <ul style={ul}>
          <li>
            <strong>1.7</strong> Before/After & Solution Hypothesis
          </li>
          <li>
            <strong>1.8</strong> Alternatives Scan
          </li>
          <li>
            <strong>1.9</strong> Value Hook
          </li>
          <li>
            <strong>1.10</strong> Gate Review
          </li>
        </ul>

        <div style={note}>
          Typical time: <strong>~45–60 min</strong>
        </div>
      </section>

      <footer style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid #ddd", opacity: 0.85 }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
          Note: Drafting your project happens locally in your browser once you create a project. You control your info - No account required!
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

const p: React.CSSProperties = {
  marginTop: 10,
  lineHeight: 1.7,
  opacity: 0.9,
  maxWidth: 860,
};

const subhead: React.CSSProperties = {
  marginTop: 12,
  fontWeight: 900,
};

const ul: React.CSSProperties = {
  marginTop: 8,
  lineHeight: 1.9,
  paddingLeft: 18,
};

const note: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  opacity: 0.85,
};

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  fontWeight: 900,
  textDecoration: "none",
  background: "#111",
  color: "#fff",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontWeight: 800,
  textDecoration: "none",
};
