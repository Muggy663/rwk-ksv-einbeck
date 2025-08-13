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
      const schuetzenSnapshot = await getDocs(collection(db, 'shooters'));
      schuetzen = schuetzenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('❌ Error loading shooters:', error);
    }
    
    // Schritt 4: Lade Disziplinen für Auflage-Prüfung
    let disziplinen = [];
    try {
      const disziplinenSnapshot = await getDocs(collection(db, 'km_disziplinen'));
      disziplinen = disziplinenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.warn('Could not load disciplines:', error);
    }

    const groups = {};
    
    for (const meldung of meldungen) {
      const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      const vereinId = schuetze?.clubId || schuetze?.kmClubId || meldung.clubId || 'unknown';
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
    

    
    // Schritt 5: Einfache Mannschafts-Erstellung
    let generated = 0;
    const debugInfo = [];
    
    // Gehe durch jede Verein-Disziplin Kombination
    for (const [key, group] of Object.entries(groups)) {
      const { vereinId, disziplinId, meldungen: groupMeldungen } = group as any;
      const disziplin = disziplinen.find(d => d.id === disziplinId);
      const istAuflage = disziplin?.auflage || false;
      
      // Alle Schützen mit Altersklassen
      const schuetzenMitKlassen = groupMeldungen.map(meldung => {
        const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
        if (!schuetze?.birthYear || !schuetze?.gender) return null;
        
        const age = 2026 - schuetze.birthYear;
        const gender = schuetze.gender;
        let altersklasse = '';
        
        if (istAuflage) {
          if (age <= 14) altersklasse = 'Schüler';
          else if (disziplin?.spoNummer === '1.41' && age >= 15 && age <= 40) altersklasse = 'Jung';
          else if (age < 41) return null; // Nicht berechtigt
          else if (age <= 50) altersklasse = 'Senioren0';
          else if (age <= 65) altersklasse = 'SeniorenI_II';
          else altersklasse = 'SeniorenIII_VI';
        } else {
          if (age <= 20) altersklasse = 'Jung';
          else if (age <= 40) altersklasse = 'Erwachsen';
          else altersklasse = 'Senior';
        }
        
        return {
          meldung,
          schuetze,
          altersklasse,
          vmRinge: meldung.vmErgebnis?.ringe || 0,
          sortKey: meldung.vmErgebnis?.ringe || schuetze.name || 'ZZZ'
        };
      }).filter(Boolean);
      
      // Gruppiere nach Altersklassen
      const altersGruppen = {};
      schuetzenMitKlassen.forEach(item => {
        if (!altersGruppen[item.altersklasse]) {
          altersGruppen[item.altersklasse] = [];
        }
        altersGruppen[item.altersklasse].push(item);
      });
      
      // Erstelle 3er-Teams aus jeder Altersgruppe
      for (const [altersklasse, schuetzenListe] of Object.entries(altersGruppen)) {
        // Sortiere: VM-Ergebnis absteigend, dann Name
        const sortiert = schuetzenListe.sort((a, b) => {
          if (b.vmRinge !== a.vmRinge) return b.vmRinge - a.vmRinge;
          return (a.schuetze.name || '').localeCompare(b.schuetze.name || '');
        });
        
        // Bilde 3er-Teams
        for (let i = 0; i < sortiert.length; i += 3) {
          const team = sortiert.slice(i, i + 3);
          if (team.length === 3) {
            const teamMeldungen = team.map(t => t.meldung);
            
            const teamSchuetzen = team.map(t => t.schuetze);
            const wettkampfklassen = team.map(t => {
              const age = 2026 - t.schuetze.birthYear;
              const gender = t.schuetze.gender;
              
              if (istAuflage) {
                if (age <= 14) return gender === 'male' ? 'Schüler m' : 'Schüler w';
                else if (disziplin?.spoNummer === '1.41' && age >= 15 && age <= 40) {
                  if (age <= 16) return gender === 'male' ? 'Jugend m' : 'Jugend w';
                  else if (age <= 18) return gender === 'male' ? 'Junioren II m' : 'Junioren II w';
                  else if (age <= 20) return gender === 'male' ? 'Junioren I m' : 'Junioren I w';
                  else return gender === 'male' ? 'Herren I' : 'Damen I';
                }
                else if (age <= 50) return 'Senioren 0';
                else if (age <= 60) return gender === 'male' ? 'Senioren I m' : 'Seniorinnen I';
                else if (age <= 65) return gender === 'male' ? 'Senioren II m' : 'Seniorinnen II';
                else if (age <= 70) return gender === 'male' ? 'Senioren III m' : 'Seniorinnen III';
                else if (age <= 75) return gender === 'male' ? 'Senioren IV m' : 'Seniorinnen IV';
                else if (age <= 80) return gender === 'male' ? 'Senioren V m' : 'Seniorinnen V';
                else return gender === 'male' ? 'Senioren VI m' : 'Seniorinnen VI';
              } else {
                if (age <= 14) return gender === 'male' ? 'Schüler m' : 'Schüler w';
                else if (age <= 16) return gender === 'male' ? 'Jugend m' : 'Jugend w';
                else if (age <= 18) return gender === 'male' ? 'Junioren II m' : 'Junioren II w';
                else if (age <= 20) return gender === 'male' ? 'Junioren I m' : 'Junioren I w';
                else if (age <= 40) return gender === 'male' ? 'Herren I' : 'Damen I';
                else if (age <= 50) return gender === 'male' ? 'Herren II' : 'Damen II';
                else if (age <= 60) return gender === 'male' ? 'Herren III' : 'Damen III';
                else if (age <= 70) return gender === 'male' ? 'Herren IV' : 'Damen IV';
                else return gender === 'male' ? 'Herren V' : 'Damen V';
              }
            });
            
            debugInfo.push({
              teamSize: 3,
              shooterNames: teamSchuetzen.map(s => s.name),
              uniqueKlassen: [...new Set(wettkampfklassen)],
              altersklasse,
              istAuflage,
              spoNummer: disziplin?.spoNummer
            });
            
            const mannschaft = {
              vereinId,
              disziplinId,
              wettkampfklassen: [...new Set(wettkampfklassen)],
              schuetzenIds: teamMeldungen.map(m => m.schuetzeId),
              name: `${altersklasse} Team ${Math.floor(i/3) + 1}`,
              saison: saison || '2026',
              createdAt: new Date().toISOString(),
              autoGenerated: true
            };
            
            try {
              const docId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await setDoc(doc(db, 'km_mannschaften', docId), mannschaft);
              generated++;
            } catch (error) {
              console.error('❌ FAILED to create mannschaft:', error);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      message: `${generated} Mannschaften aus ${meldungen.length} Meldungen generiert`,
      debugInfo,
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
