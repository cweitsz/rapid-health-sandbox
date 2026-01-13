import Link from "next/link";

export default function SprintsIndexPage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <header style={{ paddingTop: 24, paddingBottom: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Sprints</h1>
        <p style={{ marginTop: 8, maxWidth: 760, lineHeight: 1.5, opacity: 0.9 }}>
          Browse the framework first. When you’re ready to actually do it, create a dossier in Intake.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" style={secondaryBtn}>
            ← Back to Home
          </Link>
          <Link href="/intake" style={primaryBtn}>
            Go to Intake
          </Link>
        </div>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        <div style={card}>
          <h2 style={h2}>Sprint A</h2>
          <p style={p}>Define the problem, stakeholders, and current workarounds.</p>
          <Link href="/sprints/sprint-a" style={secondaryBtn}>
            View Sprint A →
          </Link>
        </div>

        <div style={card}>
          <h2 style={h2}>Sprint B</h2>
          <p style={p}>Pick metrics and validate with real users.</p>
          <Link href="/sprints/sprint-b" style={secondaryBtn}>
            View Sprint B →
          </Link>
        </div>

        <div style={card}>
          <h2 style={h2}>Sprint C</h2>
          <p style={p}>Synthesize findings and make a disciplined decision.</p>
          <Link href="/sprints/sprint-c" style={secondaryBtn}>
            View Sprint C →
          </Link>
        </div>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 16,
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
};

const p: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 12,
  lineHeight: 1.6,
  opacity: 0.9,
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
