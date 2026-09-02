// src/app/api/km/mannschaften/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getShooterClubId } from '@/lib/utils/altersklassen';
import { requireKMAuth } from '@/lib/auth/api-auth';

const KM_MANNSCHAFTEN_COLLECTION = 'km_mannschaften';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { saison, disziplinId } = body;
    
    if (!saison) {
      return NextResponse.json({
        success: false,
        error: 'Saison ist erforderlich'
      }, { status: 400 });
    }

    const db = adminDb;
    
    // Lade Meldungen aus der korrekten Collection
    const saisonSnapshot = await db.collection('km_saisons').doc(saison).get();
    const saisonData = saisonSnapshot.data();
    
    // Bestimme Collection Name basierend auf Saison-Daten
    let collectionName = 'km_meldungen';
    if (saisonData?.collectionName) {
      collectionName = saisonData.collectionName;
    } else if (saisonData?.name) {
      // Generiere Collection Name aus Saison-Name und Jahr
      const name = saisonData.name.toLowerCase();
      const jahr = saisonData.jahr || 2027;
      
      if (name.includes('luftdruck') || name.includes('luftgewehr') || name.includes('luftpistole')) {
        collectionName = `km_meldungen_${jahr}_ld`;
      } else if (name.includes('kleinkaliber pistole') || name.includes('kkp')) {
        collectionName = `km_meldungen_${jahr}_kkp`;
      } else if (name.includes('kleinkaliber') || name.includes('kk')) {
        collectionName = `km_meldungen_${jahr}_kk`;
      } else {
        collectionName = `km_meldungen_${jahr}_kk`;
      }
    }
    
    logInfo('Collection Name:', { data: collectionName });
    
    const meldungenSnapshot = await db.collection(collectionName).get();
    const alleMeldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; [key: string]: any }>;
    
    logInfo('=== MANNSCHAFTS-DEBUG ===');
    logInfo('Gesuchte Saison:', { data: saison });
    logInfo('Anzahl Meldungen gesamt:', { data: alleMeldungen.length });
    logInfo('Beispiel Meldung:', { data: alleMeldungen[0] });
    
    // Filtere nach saisonId UND optional nach Disziplin
    let meldungen = alleMeldungen.filter(m => m.saisonId === saison);
    if (disziplinId) {
      meldungen = meldungen.filter(m => m.disziplinId === disziplinId);
      logInfo('Meldungen nach Disziplin-Filter:', { data: meldungen.length, disziplinId });
    }
    logInfo('Meldungen nach Saison-Filter:', { data: meldungen.length });
    
    if (meldungen.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Keine Meldungen für diese Saison gefunden'
      }, { status: 404 });
    }

    // Lade Schützen und Disziplinen
    const [schuetzenSnapshot, clubsSnapshot] = await Promise.all([
      db.collection('shooters').get(),
      db.collection('clubs').get()
    ]);
    
    // Lade alle Disziplinen (sie haben saison: '2026', nicht saisonId)
    const disziplinenSnapshot = await db.collection('km_disziplinen').get();
    
    const schuetzen = schuetzenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; [key: string]: any }>;
    const disziplinen = disziplinenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; [key: string]: any }>;
    const clubs = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; [key: string]: any }>;
    
    // Lade Mannschaftsregeln aus der Datenbank.
    // Gespeichert wird direkt unter system_config/mannschaftsregeln (Root-Felder),
    // daher hier per Doc-ID laden (früher fälschlich per where('type') gesucht).
    const mannschaftsregelnDoc = await db.collection('system_config').doc('mannschaftsregeln').get();
    const mannschaftsregeln = mannschaftsregelnDoc.exists ? (mannschaftsregelnDoc.data() || {}) : {};
    
    logInfo('Geladene Mannschaftsregeln:', { data: Object.keys(mannschaftsregeln).length });
    logInfo('Beispiel-Regel:', { data: Object.values(mannschaftsregeln)[0] });
    logInfo('Alle Regel-Keys:', { data: Object.keys(mannschaftsregeln) });
    
    // Mannschaftsregeln - Gruppiere nach echten Altersklassen
    const gruppiert: Record<string, { vereinId: string; disziplin: any; gruppenKey: string; schuetzen: any[]; club: any }> = {};
    
    // Dynamisches Sportjahr berechnen
    const now = new Date();
    const sportjahr = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    
    logInfo('Starte Gruppierung von', { data: meldungen.length, meldungen: true });
    logInfo('Sportjahr:', { data: sportjahr });
    
    for (const meldung of meldungen) {
      const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
      
      if (!schuetze || !disziplin) continue;
      
      const vereinId = getShooterClubId(schuetze);
      if (!vereinId) continue;
      
      const age = sportjahr - (schuetze.birthYear || 0);
      const gender = schuetze.gender;
      const istAuflage = disziplin.auflage;
      const spoNummer = disziplin.spoNummer || '';
      
      // --- ALTERSKLASSE BESTIMMEN ---
      let altersklasse = 'AK';
      
      if (istAuflage) {
        // Lichtgewehr (11.10/11.11) - 6-11 Jahre, keine Mannschaftswertung
        if (spoNummer.startsWith('11.') && age >= 6 && age <= 11) {
          altersklasse = 'Lichtgewehr';
          // Keine Mannschaftswertung bei Lichtgewehr → skip
          continue;
        }
        
        // Auflage kreisintern (1.11, 1.41) — Schüler bis Schützen I/Damen I
        if ((spoNummer === '1.41' || spoNummer === '1.11') && age < 41) {
          if (age <= 14) altersklasse = 'Schüler m/w'; // Keine Mannschaftswertung für Schüler bei Auflage kreisintern
          else if (age <= 16) altersklasse = 'Jugend m/w'; // Keine Mannschaftswertung für Jugend
          else if (age <= 18) altersklasse = 'Junioren II m/w';
          else if (age <= 20) altersklasse = 'Junioren I m/w';
          else altersklasse = gender === 'male' ? 'Schützen I' : 'Damen I';
        }
        // Auflage regulär — Senioren
        else if (age >= 41) {
          if (age <= 50) altersklasse = 'Senioren 0'; // m/w gemischt!
          else if (age <= 60) altersklasse = gender === 'male' ? 'Senioren I' : 'Seniorinnen I';
          else if (age <= 65) altersklasse = gender === 'male' ? 'Senioren II' : 'Seniorinnen II';
          else if (age <= 70) altersklasse = gender === 'male' ? 'Senioren III' : 'Seniorinnen III';
          else if (age <= 75) altersklasse = gender === 'male' ? 'Senioren IV' : 'Seniorinnen IV';
          else if (age <= 80) altersklasse = gender === 'male' ? 'Senioren V' : 'Seniorinnen V';
          else altersklasse = gender === 'male' ? 'Senioren VI' : 'Seniorinnen VI';
        }
        else {
          // Unter 41 bei Auflage ohne Sonderregel → nicht berechtigt
          altersklasse = 'Nicht berechtigt';
        }
      } else {
        // FREIHAND (LG 1.10, LP 2.10 etc.)
        // Schüler und Jugend: m/w dürfen gemischt werden
        // Junioren: I und II zusammen, aber Geschlecht getrennt
        // Herren/Damen: getrennt nach Geschlecht UND Klasse
        if (age <= 14) altersklasse = 'Schüler m/w';
        else if (age <= 16) altersklasse = 'Jugend m/w';
        else if (age <= 20) altersklasse = gender === 'male' ? 'Junioren m' : 'Junioren w';
        else if (age <= 40) altersklasse = gender === 'male' ? 'Herren I' : 'Damen I';
        else if (age <= 50) altersklasse = gender === 'male' ? 'Herren II' : 'Damen II';
        else if (age <= 60) altersklasse = gender === 'male' ? 'Herren III' : 'Damen III';
        else if (age <= 70) altersklasse = gender === 'male' ? 'Herren IV' : 'Damen IV';
        else altersklasse = gender === 'male' ? 'Herren V' : 'Damen V';
      }
      
      // "Nicht berechtigt" → Kein Team
      if (altersklasse === 'Nicht berechtigt') continue;
      
      // --- MANNSCHAFTS-GRUPPIERUNG ---
      let gruppenKey = altersklasse;
      
      if (istAuflage) {
        // Senioren 0 → m/w gemischt, eigene Gruppe
        if (altersklasse === 'Senioren 0') {
          gruppenKey = 'Senioren 0';
        }
        // Senioren I-II m/w gemischt
        else if (/^Senioren (I|II)$/.test(altersklasse) || /^Seniorinnen (I|II)$/.test(altersklasse)) {
          gruppenKey = 'Senioren I-II';
        }
        // Senioren III-VI m/w gemischt
        else if (/^Senioren (III|IV|V|VI)$/.test(altersklasse) || /^Seniorinnen (III|IV|V|VI)$/.test(altersklasse)) {
          gruppenKey = 'Senioren III-VI';
        }
        // Kreisintern Auflage: Junioren I m/w zusammen, Junioren II m/w zusammen
        // (bereits durch altersklasse 'Junioren I m/w' / 'Junioren II m/w' abgedeckt)
        // Schützen I / Damen I zusammen in einer Mannschaft
        else if (altersklasse === 'Schützen I' || altersklasse === 'Damen I') {
          gruppenKey = 'Schützen I/Damen I';
        }
      } else {
        // FREIHAND: Schüler/Jugend m/w gemischt (schon durch Altersklasse abgedeckt)
        // Junioren I+II zusammen aber nach Geschlecht getrennt (schon als 'Junioren m'/'Junioren w')
        // Herren/Damen getrennt nach Klasse (schon korrekt)
        // gruppenKey = altersklasse (default)
      }
      
      // Mannschaftswertung: Schüler/Jugend bei Auflage kreisintern KEINE Mannschaftswertung
      if (istAuflage && (altersklasse === 'Schüler m/w' || altersklasse === 'Jugend m/w')) {
        continue; // Nur Einzelwertung lt. Ausschreibung
      }
      
      const key = `${vereinId}_${disziplin.id}_${gruppenKey}`;
      if (!gruppiert[key]) {
        gruppiert[key] = {
          vereinId,
          disziplin,
          gruppenKey,
          schuetzen: [],
          club: clubs.find(c => c.id === vereinId)
        };
      }
      
      gruppiert[key].schuetzen.push({
        ...schuetze,
        meldungId: meldung.id,
        altersklasse
      });
    }
    
    // Erstelle Teams - alle Gruppen mit 3+ Schützen
    const teams = [];
    
    for (const [, gruppe] of Object.entries(gruppiert)) {
      const { vereinId, disziplin, gruppenKey, schuetzen: verfuegbareSchuetzen, club } = gruppe;
      
      if (verfuegbareSchuetzen.length >= 3) {
        let teamNummer = 1;
        for (let i = 0; i < verfuegbareSchuetzen.length; i += 3) {
          const teamMitglieder = verfuegbareSchuetzen.slice(i, i + 3);
          
          if (teamMitglieder.length === 3) {
            const teamName = `${club?.name || 'Unbekannt'} ${disziplin.spoNummer} ${gruppenKey} ${teamNummer}`;
            
            teams.push({
              name: teamName,
              vereinId,
              disziplinId: disziplin.id,
              disziplinName: disziplin.name,
              spoNummer: disziplin.spoNummer,
              wettkampfklasse: gruppenKey,
              mitglieder: teamMitglieder,
              vollstaendig: true,
              saison
            });
            
            teamNummer++;
          }
        }
      }
    }
    
    logInfo('Erstellte Teams:', { data: teams.length });
    logInfo('Teams Details:', { data: teams.map(t => ({ name: t.name, mitglieder: t.mitglieder?.length })) });
    
    if (teams.length === 0) {
      logInfo('Keine Teams erstellt - Debug Info:');
      logInfo('Gruppiert Keys:', { data: Object.keys(gruppiert) });
      for (const [key, gruppe] of Object.entries(gruppiert)) {
        logInfo(`Gruppe ${key}:`, {
          vereinId: gruppe.vereinId,
          disziplin: gruppe.disziplin?.name,
          schuetzenAnzahl: Object.values(gruppe.schuetzen).flat().length
        });
      }
    }
    
    // Lösche nur bestehende Teams für die generierten Disziplinen
    const generatedDisziplinIds = [...new Set(teams.map(t => t.disziplinId))];
    
    if (generatedDisziplinIds.length > 0) {
      const existingTeamsSnapshot = await db.collection(KM_MANNSCHAFTEN_COLLECTION)
        .where('saison', '==', saison)
        .get();
      
      const batch = db.batch();
      existingTeamsSnapshot.docs.forEach(doc => {
        const teamData = doc.data();
        if (generatedDisziplinIds.includes(teamData.disziplinId)) {
          batch.delete(doc.ref);
        }
      });
      
      // Speichere neue Teams
      for (const team of teams) {
        const docRef = db.collection(KM_MANNSCHAFTEN_COLLECTION).doc();
        batch.set(docRef, {
          name: team.name,
          vereinId: team.vereinId,
          clubId: team.vereinId,
          disziplinId: team.disziplinId,
          schuetzenIds: team.mitglieder.map(m => m.id),
          wettkampfklassen: [team.wettkampfklasse],
          saison,
          createdAt: FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
    }
    
    return NextResponse.json({
      success: true,
      data: teams,
      message: `${teams.length} Mannschaften automatisch generiert`
    });
    
  } catch (error) {
    logError('Fehler beim Generieren der Mannschaften:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${getErrorMessage(error)}`
    }, { status: 500 });
  }
}