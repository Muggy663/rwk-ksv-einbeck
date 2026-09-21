// src/lib/utils/club-maps.ts
// Ordnet einem Termin-Ort (Freitext, z. B. "SC Naensen e.V.") den passenden
// Verein zu und liefert dessen hinterlegten Google-Maps-Link (clubs.mapsUrl).
// Die Zuordnung ist bewusst tolerant: "e.V.", Punkte und Leerzeichen werden
// ignoriert, damit "SC Naensen e.V." und "SC Naensen" als gleich gelten.

export interface ClubMapsInfo {
  id: string;
  name: string;
  mapsUrl?: string;
}

const norm = (s?: string): string =>
  (s || '')
    .toLowerCase()
    .replace(/\be\.?\s*v\.?(?=\s|$)/g, ' ') // "e.V." / "eV." entfernen
    .replace(/[.\s]/g, '');                 // Punkte + Leerzeichen entfernen

/**
 * Findet zum Ort-Text den Maps-Link des passenden Vereins.
 * Rückgabe: der Link oder null, wenn kein Verein mit gepflegtem Link passt.
 */
export function findMapsUrlForLocation(location: string | undefined, clubs: ClubMapsInfo[]): string | null {
  const ort = norm(location);
  if (!ort) return null;

  // Nur Vereine mit hinterlegtem Link berücksichtigen.
  const mitLink = clubs.filter(c => typeof c.mapsUrl === 'string' && c.mapsUrl.trim().length > 0);
  if (mitLink.length === 0) return null;

  // 1) exakte (normalisierte) Übereinstimmung
  const exakt = mitLink.find(c => norm(c.name) === ort);
  if (exakt) return exakt.mapsUrl!.trim();

  // 2) Teil-Übereinstimmung (Ort enthält Vereinsnamen oder umgekehrt).
  //    Längste Namen zuerst prüfen, um das spezifischste Match zu treffen.
  const kandidaten = [...mitLink].sort((a, b) => norm(b.name).length - norm(a.name).length);
  const teil = kandidaten.find(c => {
    const cn = norm(c.name);
    return cn.length >= 3 && (ort.includes(cn) || cn.includes(ort));
  });
  return teil ? teil.mapsUrl!.trim() : null;
}
