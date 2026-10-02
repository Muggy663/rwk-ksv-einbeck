// scripts/migrate-schiessnachweis-subcollection.mjs
//
// Zentrale, serverseitige Migration des Schießnachweis-Datenmodells für ALLE Nutzer.
//
// Hintergrund:
//   Altes Modell: schiessnachweis_data/{uid}  mit Array-Feld 'einträge'
//   Neues Modell: schiessnachweis_data/{uid}/eintraege/{id}  (ein Doc pro Eintrag)
//
// Diese Migration bildet exakt die Client-Logik aus
//   src/lib/services/schiessnachweis-service.ts  (migrateIfNeeded)
// nach – nur serverseitig über das Admin SDK und über alle Nutzer auf einmal.
//
// Eigenschaften:
//   - Idempotent: deterministische Doc-IDs (vorhandene id, sonst `legacy_{index}`),
//     überspringt bereits migrierte Nutzer (migratedToSubcollection === true).
//   - Sicher: standardmäßig TROCKENLAUF (zeigt nur, was passieren würde).
//     Schreibt NUR mit explizitem Flag --apply.
//   - Verliert keine Daten: schreibt zuerst die Einzeldokumente, leert erst
//     danach das Legacy-Array und setzt das Flag.
//
// Voraussetzungen (wie src/lib/firebase/admin.ts):
//   .env.local mit FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   (optional FIREBASE_DATABASE_ID, Standard 'restored-main')
//
// Verwendung:
//   Trockenlauf (nichts wird geschrieben):
//     node scripts/migrate-schiessnachweis-subcollection.mjs
//   Tatsächlich migrieren:
//     node scripts/migrate-schiessnachweis-subcollection.mjs --apply

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

// --- .env.local laden (einfacher Parser, keine zusätzliche Abhängigkeit) ---
function ladeEnvLocal() {
  try {
    const inhalt = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
    for (const zeile of inhalt.split(/\r?\n/)) {
      const t = zeile.trim();
      if (!t || t.startsWith('#')) continue;
      const gleich = t.indexOf('=');
      if (gleich === -1) continue;
      const key = t.slice(0, gleich).trim();
      let wert = t.slice(gleich + 1).trim();
      // Umschließende Anführungszeichen entfernen
      if ((wert.startsWith('"') && wert.endsWith('"')) || (wert.startsWith("'") && wert.endsWith("'"))) {
        wert = wert.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = wert;
    }
  } catch {
    // .env.local optional – Variablen können auch von außen gesetzt sein.
  }
}
ladeEnvLocal();

// --- Admin SDK initialisieren (identisch zu src/lib/firebase/admin.ts) ---
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('❌ Fehlende Service-Account-Daten. Erwartet in .env.local: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.projectId });
}
const databaseId = process.env.FIREBASE_DATABASE_ID || 'restored-main';
const db = getFirestore(undefined, databaseId);

// Entfernt undefined-Werte (Firestore erlaubt kein undefined) – wie im Client-Service.
function clean(obj) {
  const c = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) c[key] = value;
  }
  return c;
}

async function main() {
  console.log(`\n🔧 Schießnachweis-Migration (${APPLY ? 'ANWENDEN' : 'TROCKENLAUF'}) auf DB '${databaseId}'\n`);

  const parentSnap = await db.collection('schiessnachweis_data').get();
  console.log(`👥 ${parentSnap.size} Nutzer-Dokumente gefunden.\n`);

  let migriert = 0;
  let uebersprungen = 0;
  let eintraegeGesamt = 0;

  for (const parentDoc of parentSnap.docs) {
    const uid = parentDoc.id;
    const data = parentDoc.data() || {};
    const legacy = Array.isArray(data.einträge) ? data.einträge : [];

    if (data.migratedToSubcollection === true) {
      uebersprungen++;
      continue;
    }
    if (legacy.length === 0) {
      // Nichts zu migrieren – trotzdem Flag setzen, damit künftig nicht erneut geprüft wird.
      if (APPLY) {
        await parentDoc.ref.set({ migratedToSubcollection: true, migratedAt: new Date() }, { merge: true });
      }
      uebersprungen++;
      continue;
    }

    console.log(`• ${uid}: ${legacy.length} Einträge → Subcollection`);
    eintraegeGesamt += legacy.length;

    if (!APPLY) {
      migriert++;
      continue;
    }

    const subRef = parentDoc.ref.collection('eintraege');

    // In Admin-Batches (max. 500 Operationen) schreiben; deterministische IDs.
    for (let i = 0; i < legacy.length; i += 450) {
      const batch = db.batch();
      legacy.slice(i, i + 450).forEach((eintrag, offset) => {
        const index = i + offset;
        const id = (eintrag && eintrag.id) ? String(eintrag.id) : `legacy_${index}`;
        batch.set(subRef.doc(id), clean({ ...eintrag, id }));
      });
      await batch.commit();
    }

    // Erst nach erfolgreichem Schreiben: Array leeren + Flag setzen.
    await parentDoc.ref.set(
      { einträge: [], migratedToSubcollection: true, migratedAt: new Date() },
      { merge: true }
    );
    migriert++;
  }

  console.log('\n──────────────────────────────────────');
  console.log(`${APPLY ? '✅ Migriert' : '🔎 Würde migrieren'}: ${migriert} Nutzer (${eintraegeGesamt} Einträge)`);
  console.log(`⏭️  Übersprungen (bereits migriert / leer): ${uebersprungen}`);
  if (!APPLY) {
    console.log('\nℹ️  Trockenlauf – es wurde nichts geschrieben. Mit --apply tatsächlich migrieren.');
  }
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration fehlgeschlagen:', err);
    process.exit(1);
  });
