// src/lib/dossierHref.ts

function isDossierBoundPath(path: string): boolean {
  return (
    path === "/" ||
    path.startsWith("/steps/") ||
    path.startsWith("/sprints/") ||
    path === "/review" ||
    path.startsWith("/review/")
  );
}

/**
 * Add ?d=<dossierId> to an internal href, preserving existing query + hash.
 * - If dossierId is falsy, returns href unchanged.
 * - Leaves external URLs, special schemes, and hash-only links unchanged.
 *
 * DEV tripwire:
 * - Warn if called for a dossier-bound route without a dossierId.
 * - Warn if href is empty/odd.
 */
export function withDossier(href: string, dossierId?: string | null): string {
  const original = href;
  const h = (href ?? "").trim();

  // --- Dev tripwires (do not change behavior) ---
  if (process.env.NODE_ENV !== "production") {
    if (!h) {
      console.warn("[withDossier] called with empty href");
    }
    // If it's an internal-looking dossier route and there's no dossierId, scream.
    // (We check this before external/scheme checks because you *want* the warning.)
    const hashIdx0 = h.indexOf("#");
    const beforeHash0 = hashIdx0 >= 0 ? h.slice(0, hashIdx0) : h;
    const qIdx0 = beforeHash0.indexOf("?");
    const path0 = qIdx0 >= 0 ? beforeHash0.slice(0, qIdx0) : beforeHash0;

    if (isDossierBoundPath(path0)) {
      const d0 = (dossierId ?? "").trim();
      if (!d0) {
        console.warn("[withDossier] dossier-bound href used without dossierId:", {
          href: original,
          path: path0,
        });
      }
    }
  }
  // --- end dev tripwires ---

  const d = (dossierId ?? "").trim();
  if (!d) return href;
  if (!h) return href;

  // Don't touch hash-only anchors
  if (h.startsWith("#")) return href;

  // Don't touch protocol-relative URLs (e.g. //example.com)
  if (h.startsWith("//")) return href;

  // Don't touch anything with a URI scheme (mailto:, tel:, http:, https:, sms:, blob:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(h)) return href;

  // Split off hash (first # only)
  const hashIdx = h.indexOf("#");
  const beforeHash = hashIdx >= 0 ? h.slice(0, hashIdx) : h;
  const hashPart = hashIdx >= 0 ? h.slice(hashIdx) : "";

  // Split off query (first ? only)
  const qIdx = beforeHash.indexOf("?");
  const path = qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash;
  const query = qIdx >= 0 ? beforeHash.slice(qIdx + 1) : "";

  const params = new URLSearchParams(query);
  params.set("d", d);

  const qs = params.toString();
  return qs ? `${path}?${qs}${hashPart}` : `${path}${hashPart}`;
}
