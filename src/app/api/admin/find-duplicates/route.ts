import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'rwk_scores'));
    const shooters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Debug: Zeige alle Schützen
    console.log('Gefundene Schützen:', shooters.length);
    console.log('Erste 5 Schützen:', shooters.slice(0, 5));

    const duplicateMap = new Map();
    
    shooters.forEach(shooter => {
      // Verwende shooterId + Disziplin als Hauptschlüssel für echte Duplikate
      const key = `${shooter.shooterId}|${shooter.durchgang}|${shooter.competitionYear}|${shooter.leagueType}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key).push({
        id: shooter.id,
        name: shooter.shooterName,
        team: shooter.teamName,
        durchgang: shooter.durchgang,
        totalRinge: shooter.totalRinge || 0,
        seasonName: shooter.seasonName,
        enteredBy: shooter.enteredByUserName,
        entryDate: shooter.entryTimestamp?.seconds ? new Date(shooter.entryTimestamp.seconds * 1000).toLocaleString('de-DE') : 'Unbekannt'
      });
    });

    const duplicates = [];
    duplicateMap.forEach((entries, key) => {
      if (entries.length > 1) {
        const first = entries[0];
        duplicates.push({ 
          name: first.name, 
          team: `${first.team} (${entries[0].leagueType || 'KK'}, DG${first.durchgang}, ${first.seasonName || '2025'})`, 
          entries 
        });
      }
    });

    // Debug: Zeige Duplikate
    console.log('Gefundene Duplikate:', duplicates.length);

    return NextResponse.json({ 
      duplicates, 
      debug: {
        totalShooters: shooters.length,
        duplicateCount: duplicates.length,
        sampleShooters: shooters.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Fehler:', error);
    return NextResponse.json({ error: 'Fehler beim Suchen der Duplikate' }, { status: 500 });
  }
}