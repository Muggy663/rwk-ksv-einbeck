// src/app/api/km/mannschaften/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json().catch(() => ({}));
    const { saison = '2026' } = body;
    
    // Schritt 1: Lösche alte Mannschaften für diese Saison

    try {
      const { deleteDoc } = await import('firebase/firestore');
      const oldMannschaftenSnapshot = await getDocs(collection(db, 'km_mannschaften'));
      const oldDocs = oldMannschaftenSnapshot.docs.filter(doc => doc.data().saison === saison);
      
      for (const docToDelete of oldDocs) {
        await deleteDoc(docToDelete.ref);
      }

    } catch (error) {
      console.warn('⚠️ Could not clear old mannschaften:', error.message);
    }
    
    // Schritt 2: Lade Meldungen

    let meldungen = [];
    try {
      const meldungenSnapshot = await getDocs(collection(db, 'km_meldungen'));
      meldungen = meldungenSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.saison === saison || !m.saison); // Include entries without saison

    } catch (error) {
      console.error('❌ Error loading meldungen:', error);
      return NextResponse.json({
        success: false,
        error: `Fehler beim Laden der Meldungen: ${error.message}`
      }, { status: 500 });
    }
    
    if (meldungen.length === 0) {
      return NextResponse.json({
        success: true,
        generated: 0,
        message: 'Keine Meldungen für Saison ' + saison + ' gefunden.'
      });
    }
    
    // Schritt 3: Lade Schützen für Club-Zuordnung

    let schuetzen = [];
    try {
      const schuetzenSnapshot = await getDocs(collection(db, 'km_shooters'));
      schuetzen = schuetzenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('❌ Error loading shooters:', error);
    }
    
    // Schritt 4: Mannschafts-Generierung mit Schützen-Lookup


    const groups = {};
    
    for (const meldung of meldungen) {
      const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      const vereinId = schuetze?.kmClubId || meldung.clubId || 'unknown';
      const disziplinId = meldung.disziplinId || 'unknown';
      const key = `${vereinId}_${disziplinId}`;

      
      if (!groups[key]) {
        groups[key] = {
          vereinId,
          disziplinId,
          meldungen: []
        };
      }
      
      groups[key].meldungen.push(meldung);
    }
    

    
    // Schritt 5: Erstelle Mannschaften
    let generated = 0;
    for (const [key, group] of Object.entries(groups)) {
      const { vereinId, disziplinId, meldungen: groupMeldungen } = group as any;
      
      // Sortiere Meldungen nach Altersklassen und VM-Ergebnissen
      const sortedMeldungen = groupMeldungen.sort((a, b) => {
        const schuetzeA = schuetzen.find(s => s.id === a.schuetzeId);
        const schuetzeB = schuetzen.find(s => s.id === b.schuetzeId);
        
        if (!schuetzeA || !schuetzeB) return 0;
        
        // Erst nach Altersklasse sortieren
        const ageA = 2026 - (schuetzeA.birthYear || 2000);
        const ageB = 2026 - (schuetzeB.birthYear || 2000);
        
        const ageGroupA = ageA <= 40 ? 'I' : ageA <= 50 ? 'II' : 'Senior';
        const ageGroupB = ageB <= 40 ? 'I' : ageB <= 50 ? 'II' : 'Senior';
        
        if (ageGroupA !== ageGroupB) {
          return ageGroupA.localeCompare(ageGroupB);
        }
        
        // Innerhalb der gleichen Altersklasse: nach VM-Ergebnis (beste zuerst)
        const ringeA = a.vmErgebnis?.ringe || 0;
        const ringeB = b.vmErgebnis?.ringe || 0;
        
        return ringeB - ringeA; // Höchste Ringzahl zuerst
      });
      
      // Bilde 3er-Teams aus sortierten Meldungen
      for (let i = 0; i < sortedMeldungen.length; i += 3) {
        const teamMeldungen = sortedMeldungen.slice(i, i + 3);
        
        if (teamMeldungen.length === 3) { // Nur vollständige 3er-Teams, keine Einzelschützen
          // Berechne Wettkampfklassen basierend auf Schützen
          const teamSchuetzen = teamMeldungen.map(m => schuetzen.find(s => s.id === m.schuetzeId)).filter(Boolean);
          
          // Vereinfachte Altersklassen-Berechnung
          const wettkampfklassen = teamSchuetzen.map(schuetze => {
            if (!schuetze.birthYear || !schuetze.gender) return 'Unbekannt';
            
            const age = 2026 - schuetze.birthYear;
            const suffix = schuetze.gender === 'male' ? ' I' : ' I'; // Vereinfacht: alle als Klasse I
            
            if (age <= 40) return schuetze.gender === 'male' ? 'Herren I' : 'Damen I';
            if (age <= 50) return schuetze.gender === 'male' ? 'Herren II' : 'Damen II';
            return schuetze.gender === 'male' ? 'Senioren I' : 'Seniorinnen I';
          }).filter(k => k !== 'Unbekannt');
          

          
          // Prüfe Mannschaftsregeln für gemischte Teams
          const uniqueKlassen = [...new Set(wettkampfklassen)];
          if (uniqueKlassen.length > 1) {
            // Erlaubte Mischungen prüfen
            const allowedMixes = [
              ['Schüler m', 'Jugend m'], ['Schüler w', 'Jugend w'],
              ['Senioren 0'], // Senioren 0 kann gemischt werden
              ['Senioren I', 'Senioren II'], ['Seniorinnen I', 'Seniorinnen II'],
              ['Senioren III', 'Senioren IV', 'Senioren V', 'Senioren VI'],
              ['Seniorinnen III', 'Seniorinnen IV', 'Seniorinnen V', 'Seniorinnen VI']
            ];
            // Herren/Damen I-V sind NICHT in den erlaubten Mischungen = getrennt!
            
            const isAllowedMix = allowedMixes.some(mix => 
              uniqueKlassen.every(klasse => mix.includes(klasse))
            );
            
            if (!isAllowedMix) {

              continue;
            }
          }
          
          const mannschaft = {
            vereinId: vereinId || 'test-verein',
            disziplinId: disziplinId || 'test-disziplin', 
            wettkampfklassen: uniqueKlassen.length > 0 ? uniqueKlassen : ['Unbekannt'],
            schuetzenIds: teamMeldungen.map(m => m.schuetzeId).filter(Boolean),
            name: `Team ${Math.floor(i/3) + 1}`,
            saison: saison || '2026',
            createdAt: new Date().toISOString(),
            autoGenerated: true
          };
          

          
          try {
            const docId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await setDoc(doc(db, 'km_mannschaften', docId), mannschaft);

            generated++;
          } catch (error) {
            console.error('❌ FAILED to create mannschaft:', error.message, error.code);
            return NextResponse.json({
              success: false,
              error: `Firestore error: ${error.message}`,
              mannschaft
            });
          }
        }
      }
    }


    return NextResponse.json({
      success: true,
      generated,
      message: `${generated} Mannschaften aus ${meldungen.length} Meldungen generiert`,
      debug: {
        processedTeams: generated,
        meldungenCount: meldungen.length,
        schuetzenCount: schuetzen.length,
        groupsCount: Object.keys(groups).length,
        groups: Object.keys(groups),
        sampleShooter: schuetzen.find(s => s.name?.includes('Aurin')),
        teamsProcessed: Object.entries(groups).map(([key, group]) => {
          const { vereinId, disziplinId, meldungen: groupMeldungen } = group as any;
          const teamResults = [];
          
          for (let i = 0; i < groupMeldungen.length; i += 3) {
            const teamMeldungen = groupMeldungen.slice(i, i + 3);
            const teamSchuetzen = teamMeldungen.map(m => schuetzen.find(s => s.id === m.schuetzeId)).filter(Boolean);
            
            const ageGroups = teamSchuetzen.map(s => {
              if (!s.birthYear || !s.gender) return 'Unknown';
              const age = 2026 - s.birthYear;
              if (age <= 40) return s.gender === 'male' ? 'Herren I' : 'Damen I';
              if (age <= 50) return s.gender === 'male' ? 'Herren II' : 'Damen II';
              return s.gender === 'male' ? 'Senioren I' : 'Seniorinnen I';
            });
            
            teamResults.push({
              teamSize: teamMeldungen.length,
              shooters: teamSchuetzen.map(s => ({ name: s.name, age: 2026 - s.birthYear })),
              ageGroups,
              uniqueAgeGroups: [...new Set(ageGroups)],
              wouldCreate: teamMeldungen.length === 3 && [...new Set(ageGroups)].length === 1
            });
          }
          
          return { key, shooterCount: group.meldungen.length, teamResults };
        })
      }
    });

  } catch (error) {
    console.error('💥 Fehler bei Mannschafts-Generierung:', error);
    return NextResponse.json({
      success: false,
      error: `Unerwarteter Fehler: ${error.message}`
    }, { status: 500 });
  }
}
