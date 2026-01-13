// src/lib/withDossier.ts
export function withDossier(path: string, dossierId?: string | null): string {
  if (!dossierId) return path;

  // Keep hash fragments intact
  const [beforeHash, hash] = path.split("#", 2);

  const [pathname, queryString] = beforeHash.split("?", 2);

  // Intake is dossier-neutral by your rules
  if (pathname === "/intake" || pathname.startsWith("/intake")) return path;

  const params = new URLSearchParams(queryString ?? "");
  if (!params.has("d")) params.set("d", dossierId);

  const qs = params.toString();
  const rebuilt = qs ? `${pathname}?${qs}` : pathname;

  return hash ? `${rebuilt}#${hash}` : rebuilt;
}
