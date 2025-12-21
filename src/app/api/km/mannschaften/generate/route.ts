// src/app/api/km/mannschaften/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const KM_MANNSCHAFTEN_COLLECTION = 'km_mannschaften';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saison } = body;
    
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
      // Fallback: Generiere Collection Name aus Saison-Name
      const name = saisonData.name.toLowerCase();
      if (name.includes('2026') && name.includes('luftdruck')) {
        collectionName = 'km_meldungen_2026_ld';
      }
    }
    
    console.log('Collection Name:', collectionName);
    
    const meldungenSnapshot = await db.collection(collectionName).get();
    const alleMeldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('=== MANNSCHAFTS-DEBUG ===');
    console.log('Gesuchte Saison:', saison);
    console.log('Anzahl Meldungen gesamt:', alleMeldungen.length);
    console.log('Beispiel Meldung:', alleMeldungen[0]);
    
    // Filtere nach saisonId UND nach Vereinszugehörigkeit
    const meldungen = alleMeldungen.filter(m => m.saisonId === saison);
    console.log('Meldungen nach Saison-Filter:', meldungen.length);
    
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
    
    const schuetzen = schuetzenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const disziplinen = disziplinenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const clubs = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Lade Mannschaftsregeln aus der Datenbank
    const mannschaftsregelnSnapshot = await db.collection('system_config')
      .where('type', '==', 'mannschaftsregeln')
      .get();
    
    let mannschaftsregeln = {};
    if (!mannschaftsregelnSnapshot.empty) {
      const doc = mannschaftsregelnSnapshot.docs[0];
      mannschaftsregeln = doc.data().regeln || {};
    }
    
    console.log('Geladene Mannschaftsregeln:', Object.keys(mannschaftsregeln).length);
    console.log('Beispiel-Regel:', Object.values(mannschaftsregeln)[0]);
    console.log('Alle Regel-Keys:', Object.keys(mannschaftsregeln));
    
    // Mannschaftsregeln - Gruppiere nach echten Altersklassen
    const gruppiert = {};
    
    console.log('Starte Gruppierung von', meldungen.length, 'Meldungen');
    
    for (const meldung of meldungen) {
      const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
      
      if (!schuetze || !disziplin) continue;
      
      const vereinId = schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId;
      if (!vereinId) continue;
      
      // Bestimme Altersklasse nach echten KM-Regeln
      const sportjahr = 2026;
      const age = sportjahr - (schuetze.birthYear || 0);
      const gender = schuetze.gender;
      const istAuflage = disziplin.auflage;
      
      let altersklasse = 'AK'; // Default
      
      if (istAuflage) {
        // Lichtgewehr (11.11) - spezielle Altersklasse für 6-11 Jahre
        if (disziplin.spoNummer === '11.11' && age >= 6 && age <= 11) {
          altersklasse = gender === 'male' ? 'Lichtgewehr m' : 'Lichtgewehr w';
        }
        else if (age <= 14) altersklasse = gender === 'male' ? 'Schüler m' : 'Schüler w';
        else if (disziplin.spoNummer === '1.41' && age >= 15 && age <= 40) {
          if (age <= 16) altersklasse = gender === 'male' ? 'Jugend m' : 'Jugend w';
          else if (age <= 18) altersklasse = gender === 'male' ? 'Junioren II m' : 'Junioren II w';
          else if (age <= 20) altersklasse = gender === 'male' ? 'Junioren I m' : 'Junioren I w';
          else altersklasse = gender === 'male' ? 'Herren I' : 'Damen I';
        }
        else if (age < 41) altersklasse = 'Nicht berechtigt';
        else if (age <= 50) altersklasse = 'Senioren 0';
        else if (age <= 60) altersklasse = gender === 'male' ? 'Senioren I m' : 'Seniorinnen I';
        else if (age <= 65) altersklasse = gender === 'male' ? 'Senioren II m' : 'Seniorinnen II';
        else if (age <= 70) altersklasse = gender === 'male' ? 'Senioren III m' : 'Seniorinnen III';
        else if (age <= 75) altersklasse = gender === 'male' ? 'Senioren IV m' : 'Seniorinnen IV';
        else if (age <= 80) altersklasse = gender === 'male' ? 'Senioren V m' : 'Seniorinnen V';
        else altersklasse = gender === 'male' ? 'Senioren VI m' : 'Seniorinnen VI';
      } else {
        if (age <= 14) altersklasse = gender === 'male' ? 'Schüler m' : 'Schüler w';
        else if (age <= 16) altersklasse = gender === 'male' ? 'Jugend m' : 'Jugend w';
        else if (age <= 18) altersklasse = gender === 'male' ? 'Junioren II m' : 'Junioren II w';
        else if (age <= 20) altersklasse = gender === 'male' ? 'Junioren I m' : 'Junioren I w';
        else if (age <= 40) altersklasse = gender === 'male' ? 'Herren I' : 'Damen I';
        else if (age <= 50) altersklasse = gender === 'male' ? 'Herren II' : 'Damen II';
        else if (age <= 60) altersklasse = gender === 'male' ? 'Herren III' : 'Damen III';
        else if (age <= 70) altersklasse = gender === 'male' ? 'Herren IV' : 'Damen IV';
        else altersklasse = gender === 'male' ? 'Herren V' : 'Damen V';
      }
      
      // Bestimme Gruppierungs-Schlüssel basierend auf Mannschaftsregeln
      let gruppenKey = altersklasse;
      
      // Senioren-Regeln für Auflage-Disziplinen
      if (istAuflage) {
        if (altersklasse.includes('Senioren I') || altersklasse.includes('Seniorinnen I') ||
            altersklasse.includes('Senioren II') || altersklasse.includes('Seniorinnen II')) {
          gruppenKey = 'Senioren I+II';
        }
        else if (altersklasse.includes('Senioren III') || altersklasse.includes('Seniorinnen III') ||
                 altersklasse.includes('Senioren IV') || altersklasse.includes('Seniorinnen IV')) {
          gruppenKey = 'Senioren III+IV';
        }
        else if (altersklasse.includes('Senioren V') || altersklasse.includes('Seniorinnen V') ||
                 altersklasse.includes('Senioren VI') || altersklasse.includes('Seniorinnen VI')) {
          gruppenKey = 'Senioren V+VI';
        }
        // Senioren 0 bleibt allein
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
    
    for (const [key, gruppe] of Object.entries(gruppiert)) {
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
    
    console.log('Erstellte Teams:', teams.length);
    console.log('Teams Details:', teams.map(t => ({ name: t.name, mitglieder: t.mitglieder?.length })));
    
    if (teams.length === 0) {
      console.log('Keine Teams erstellt - Debug Info:');
      console.log('Gruppiert Keys:', Object.keys(gruppiert));
      for (const [key, gruppe] of Object.entries(gruppiert)) {
        console.log(`Gruppe ${key}:`, {
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
      error: `Fehler: ${error.message}`
    }, { status: 500 });
  }
}