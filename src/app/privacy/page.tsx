export default function PrivacyPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Privacy & data handling</h1>

      <p style={{ marginTop: 12, lineHeight: 1.6 }}>
        This app currently stores your work <strong>locally in your browser</strong> (localStorage). There is no account
        system and nothing is being synced to a server by default.
      </p>

      <h2 style={{ marginTop: 22, fontSize: 18, fontWeight: 900 }}>Important</h2>
      <ul style={{ marginTop: 10, lineHeight: 1.8 }}>
        <li>
          <strong>Do not enter identifiable patient information</strong> (names, DOB, address, Medicare numbers, etc).
        </li>
        <li>This tool is for product/innovation validation work, not clinical records.</li>
        <li>If you need to share your work, export JSON and share that file intentionally.</li>
      </ul>

      <h2 style={{ marginTop: 22, fontSize: 18, fontWeight: 900 }}>What we may add later</h2>
      <p style={{ marginTop: 10, lineHeight: 1.6 }}>
        If/when sharing links or cloud storage are introduced, this page will be updated with clear details on what is
        stored, where, and how.
      </p>
    </main>
  );
}
