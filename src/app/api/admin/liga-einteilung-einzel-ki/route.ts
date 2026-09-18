// src/app/api/admin/liga-einteilung-einzel-ki/route.ts
// Ordnet Einzelstarter (Auflage) per Gemini den passenden Ligen zu.
// Regeln (Prompt): Einzel kommt in die Liga der Mannschaft desselben Vereins ("wenige
// Fahrten"); gibt es im selben Verein eine Mannschaft mit gleichem Nachnamen, zu deren
// Liga; ein Neuling ohne Vorjahr in die niedrigste Liga. Bei mehreren Mannschaften
// eines Vereins nach Stärke/Vorjahr entscheiden.
// Serverseitige Validierung + deterministischer Fallback, falls die KI ausfällt.
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from '@/lib/ai/config';
import { secureLogger } from '@/lib/utils/secure-logger';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface EinzelInput {
  docId: string;
  name: string;          // Team-/Anzeigename (z. B. "SV Edemissen e.V. II")
  clubId: string;
  schuetzen: string[];   // Namen der gemeldeten Einzelschützen
  ringe: number | null;  // Vorjahres-Ringe des Schützen (falls vorhanden)
}
interface MannschaftInput {
  name: string;
  clubId: string;
  ligaId: string;
  ligaName: string;
  ligaOrder: number;
  schuetzen: string[];
}
interface LigaInput {
  id: string;
  name: string;
  order: number;
}
interface Zuordnung {
  docId: string;
  ligaId: string;
  ligaName: string;
  grund: string;
  unsicher: boolean;
}

function nachname(fullName: string): string {
  // "Nachname, Vorname" ODER "Vorname Nachname"
  const s = (fullName || '').trim();
  if (s.includes(',')) return s.split(',')[0].trim().toLowerCase();
  const parts = s.split(/\s+/);
  return (parts[parts.length - 1] || '').toLowerCase();
}

/**
 * Deterministischer Fallback / Validierungsbasis:
 *  1) Mannschaft desselben Vereins mit gleichem Nachname -> deren Liga
 *  2) sonst: Verein hat Mannschaft(en) -> stärkste (kleinste order) Liga des Vereins
 *  3) sonst: niedrigste Liga; als "unsicher" markiert
 */
function deterministisch(
  einzel: EinzelInput[],
  mannschaften: MannschaftInput[],
  ligen: LigaInput[],
): Zuordnung[] {
  const sortLigen = [...ligen].sort((a, b) => a.order - b.order);
  const niedrigste = sortLigen[sortLigen.length - 1];
  return einzel.map((e) => {
    const vereinsMannschaften = mannschaften.filter((m) => m.clubId === e.clubId);
    // 1) Nachname-Match
    const einzelNachnamen = new Set(e.schuetzen.map(nachname));
    const namensMatch = vereinsMannschaften.find((m) => m.schuetzen.some((s) => einzelNachnamen.has(nachname(s))));
    if (namensMatch) {
      return { docId: e.docId, ligaId: namensMatch.ligaId, ligaName: namensMatch.ligaName, grund: 'Gleicher Nachname wie in einer Vereinsmannschaft', unsicher: false };
    }
    // 2) stärkste Liga des Vereins
    if (vereinsMannschaften.length > 0) {
      const staerkste = [...vereinsMannschaften].sort((a, b) => a.ligaOrder - b.ligaOrder)[0];
      const mehrdeutig = new Set(vereinsMannschaften.map((m) => m.ligaId)).size > 1;
      return { docId: e.docId, ligaId: staerkste.ligaId, ligaName: staerkste.ligaName, grund: 'Zur Mannschaft desselben Vereins (wenige Fahrten)', unsicher: mehrdeutig };
    }
    // 3) niedrigste Liga
    return { docId: e.docId, ligaId: niedrigste?.id || '', ligaName: niedrigste?.name || '', grund: 'Neuer Starter ohne Vereinsmannschaft – niedrigste Liga', unsicher: true };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const einzel: EinzelInput[] = Array.isArray(body.einzel) ? body.einzel : [];
    const mannschaften: MannschaftInput[] = Array.isArray(body.mannschaften) ? body.mannschaften : [];
    const ligen: LigaInput[] = Array.isArray(body.ligen) ? body.ligen : [];

    if (einzel.length === 0 || ligen.length === 0) {
      return NextResponse.json({ success: true, zuordnungen: [] });
    }

    // Deterministische Basis (dient auch als Fallback)
    const basis = deterministisch(einzel, mannschaften, ligen);
    const gueltigeLigaIds = new Set(ligen.map((l) => l.id));

    // Ohne API-Key: nur deterministisch
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: true, zuordnungen: basis, quelle: 'deterministisch' });
    }

    const prompt = `Du hilfst bei der Einteilung von EINZELSTARTERN im Luftgewehr-Auflage-Rundenwettkampf in die passende Liga.

REGELN (Priorität von oben):
1. Hat der Einzelstarter denselben Nachnamen wie ein Schütze in einer Mannschaft desselben Vereins, kommt er in DIE Liga dieser Mannschaft.
2. Sonst kommt er in die Liga der Mannschaft seines Vereins (möglichst wenige Fahrten). Hat der Verein mehrere Mannschaften, wähle anhand der Vorjahres-Ringe die passende Stärke (mehr Ringe -> höhere Liga).
3. Hat der Verein keine Mannschaft oder ist der Starter neu (keine Ringe), kommt er in die NIEDRIGSTE Liga.

LIGEN (niedrigere "order" = höhere Liga):
${ligen.map((l) => `- ${l.name} [id:${l.id}, order:${l.order}]`).join('\n')}

MANNSCHAFTEN (bereits eingeteilt):
${mannschaften.map((m) => `- Verein:${m.clubId} "${m.name}" in ${m.ligaName} [ligaId:${m.ligaId}] Schützen: ${m.schuetzen.join(', ') || '-'}`).join('\n')}

EINZELSTARTER (jeweils zuzuordnen):
${einzel.map((e) => `- docId:${e.docId} Verein:${e.clubId} "${e.name}" Ringe:${e.ringe ?? 'keine'} Schützen: ${e.schuetzen.join(', ') || '-'}`).join('\n')}

Antworte AUSSCHLIESSLICH mit einem JSON-Array, ein Objekt pro Einzelstarter, exakt in diesem Format:
[{"docId":"...","ligaId":"<eine der obigen Liga-ids>","grund":"kurze Begründung","unsicher":true|false}]
Keine weiteren Texte, kein Markdown.`;

    let zuordnungen: Zuordnung[] = basis;
    let quelle = 'deterministisch';
    try {
      const response = await genAI.models.generateContent({
        model: AI_CONFIG.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = (response.text || '').trim().replace(/^```json\s*/i, '').replace(/```$/,'').trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        // KI-Ergebnis validieren und mit deterministischer Basis absichern
        const byDoc = new Map<string, Zuordnung>(basis.map((b) => [b.docId, b]));
        const ligaName = new Map(ligen.map((l) => [l.id, l.name]));
        for (const item of parsed) {
          const docId = String(item?.docId || '');
          const ligaId = String(item?.ligaId || '');
          if (!byDoc.has(docId)) continue;             // unbekannte docId ignorieren
          if (!gueltigeLigaIds.has(ligaId)) continue;  // ungültige Liga -> Basis behalten
          byDoc.set(docId, {
            docId,
            ligaId,
            ligaName: ligaName.get(ligaId) || '',
            grund: String(item?.grund || 'KI-Vorschlag'),
            unsicher: !!item?.unsicher,
          });
        }
        zuordnungen = Array.from(byDoc.values());
        quelle = 'ki';
      }
    } catch (kiErr) {
      secureLogger.warn('Einzel-KI fehlgeschlagen, nutze deterministischen Fallback', 'liga-einteilung-einzel-ki');
      zuordnungen = basis;
      quelle = 'deterministisch-fallback';
    }

    return NextResponse.json({ success: true, zuordnungen, quelle });
  } catch (error) {
    secureLogger.error('Einzel-Einteilung fehlgeschlagen', undefined, 'liga-einteilung-einzel-ki');
    return NextResponse.json({ success: false, error: 'Einteilung fehlgeschlagen' }, { status: 500 });
  }
}
