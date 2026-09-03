// src/app/api/km/meldungen/backfill-altersklasse/route.ts
// Admin-Migration: schreibt in bestehende KM-Meldungen die (fehlende) Altersklasse
// nachträglich hinein. Datengetrieben über die zentrale ermittleEinzelklasse-Logik.
import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { ermittleEinzelklasse, type KmAltersklasse } from '@/lib/utils/altersklassen';

const ADMIN_EMAILS = ['admin@rwk-einbeck.de', 'stephanie.buenger@gmx.de'];

// Alle KM-Meldungs-Collections (Jahre 2026/2027, Disziplin-Kürzel kk/kkp/ld)
const JAHRE = [2026, 2027];
const KUERZEL = ['kk', 'kkp', 'ld'];

export async function POST(request: NextRequest) {
  try {
    // Nur Administratoren
    const user = await verifyApiAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const email = (user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ success: false, error: 'Nur Administratoren dürfen diese Migration ausführen' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const overwrite = body?.overwrite === true; // auch vorhandene Klassen neu berechnen

    // Stammdaten einmalig laden
    const [schuetzenSnap, disziplinenSnap, altersklassenSnap, saisonsSnap] = await Promise.all([
      adminDb.collection('shooters').get(),
      adminDb.collection('km_disziplinen').get(),
      adminDb.collection('km_altersklassen').get(),
      adminDb.collection('km_saisons').get()
    ]);

    const schuetzenMap = new Map<string, any>();
    schuetzenSnap.docs.forEach(d => schuetzenMap.set(d.id, d.data()));
    const disziplinenMap = new Map<string, any>();
    disziplinenSnap.docs.forEach(d => disziplinenMap.set(d.id, d.data()));
    const altersklassenListe = altersklassenSnap.docs.map(d => d.data()) as KmAltersklasse[];
    // saisonId -> jahr (für das maßgebliche Alter)
    const saisonJahrMap = new Map<string, number>();
    saisonsSnap.docs.forEach(d => {
      const data = d.data() as any;
      if (data?.jahr) saisonJahrMap.set(d.id, data.jahr);
    });

    let geprueft = 0;
    let aktualisiert = 0;
    let uebersprungen = 0;
    const details: Array<{ collection: string; aktualisiert: number; geprueft: number }> = [];

    for (const jahr of JAHRE) {
      for (const kuerzel of KUERZEL) {
        const collectionName = `km_meldungen_${jahr}_${kuerzel}`;
        let snap;
        try {
          snap = await adminDb.collection(collectionName).get();
        } catch {
          continue; // Collection existiert nicht
        }
        if (snap.empty) continue;

        let colAktualisiert = 0;
        const docs = snap.docs;

        // In 500er-Batches schreiben
        for (let i = 0; i < docs.length; i += 500) {
          const batch = adminDb.batch();
          let batchHatAenderung = false;

          for (const doc of docs.slice(i, i + 500)) {
            geprueft++;
            const m = doc.data() as any;

            // Bereits gesetzt und kein Overwrite → überspringen
            if (!overwrite && m.altersklasse) {
              uebersprungen++;
              continue;
            }

            const schuetze = schuetzenMap.get(m.schuetzeId);
            const disziplin = disziplinenMap.get(m.disziplinId);
            if (!schuetze || !disziplin) {
              uebersprungen++;
              continue;
            }

            // Saison-Jahr bestimmen: aus km_saisons, sonst aus Meldung (jahr), sonst Collection-Jahr
            const saisonJahr = saisonJahrMap.get(m.saisonId) || m.jahr || jahr;

            const klasse = ermittleEinzelklasse({
              birthYear: schuetze.birthYear,
              gender: schuetze.gender,
              auflage: !!disziplin.auflage,
              spoNummer: disziplin.spoNummer,
              saisonJahr,
              altersklassen: altersklassenListe,
              altersgenehmigung: !!schuetze.sondergenehmigung
            });

            // Nur schreiben, wenn sich etwas ändert
            if (klasse && klasse !== m.altersklasse) {
              batch.update(doc.ref, { altersklasse: klasse });
              batchHatAenderung = true;
              colAktualisiert++;
              aktualisiert++;
            } else {
              uebersprungen++;
            }
          }

          if (batchHatAenderung) await batch.commit();
        }

        if (colAktualisiert > 0) {
          details.push({ collection: collectionName, aktualisiert: colAktualisiert, geprueft: docs.length });
        }
      }
    }

    logInfo(`Backfill Altersklasse: ${aktualisiert} aktualisiert, ${uebersprungen} übersprungen (durch ${email}, overwrite=${overwrite})`);
    return NextResponse.json({
      success: true,
      geprueft,
      aktualisiert,
      uebersprungen,
      details,
      message: `${aktualisiert} Meldungen mit Altersklasse aktualisiert`
    });
  } catch (error) {
    logError('Fehler beim Backfill der Altersklassen:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
