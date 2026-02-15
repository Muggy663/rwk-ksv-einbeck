import { NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { getShooterClubId } from '@/lib/utils/altersklassen';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET() {
  try {
    logDebug('🔍 VALIDATION: Starte System-Validierung...');
    
    const results = {
      shooters: { total: 0, byClub: {} },
      clubs: { total: 0, withShooters: 0 },
      teams: { total: 0, withShooters: 0 },
      issues: []
    };
    
    // 1. Schützen zählen
    const shootersSnapshot = await getDocs(collection(db, 'shooters'));
    results.shooters.total = shootersSnapshot.size;
    
    // 2. Vereine laden
    const clubsSnapshot = await getDocs(collection(db, 'clubs'));
    results.clubs.total = clubsSnapshot.size;
    
    const clubsMap = new Map();
    clubsSnapshot.docs.forEach(doc => {
      const clubData = doc.data();
      clubsMap.set(doc.id, clubData.name);
      results.shooters.byClub[clubData.name] = 0;
    });
    
    // 3. Schützen pro Verein zählen
    shootersSnapshot.docs.forEach(doc => {
      const shooterData = doc.data();
      const clubId = getShooterClubId(shooterData);
      const clubName = clubsMap.get(clubId) || 'Unbekannt';
      
      if (results.shooters.byClub[clubName] !== undefined) {
        results.shooters.byClub[clubName]++;
      } else {
        results.shooters.byClub[clubName] = 1;
      }
      
      // Validierungen
      if (!shooterData.firstName || !shooterData.lastName) {
        results.issues.push(`Schütze ${doc.id}: Fehlende Namen`);
      }
      if (!clubId) {
        results.issues.push(`Schütze ${doc.id}: Keine Vereinszuordnung`);
      }
      if (!shooterData.gender) {
        results.issues.push(`Schütze ${doc.id}: Kein Geschlecht`);
      }
    });
    
    // 4. Vereine mit Schützen zählen
    results.clubs.withShooters = Object.values(results.shooters.byClub)
      .filter(count => count > 0).length;
    
    // 5. Teams prüfen
    const teamsSnapshot = await getDocs(collection(db, 'rwk_teams'));
    results.teams.total = teamsSnapshot.size;
    
    teamsSnapshot.docs.forEach(doc => {
      const teamData = doc.data();
      if (teamData.shooterIds && teamData.shooterIds.length > 0) {
        results.teams.withShooters++;
      }
    });
    
    // 6. Duplikate prüfen
    const nameMap = new Map();
    shootersSnapshot.docs.forEach(doc => {
      const shooterData = doc.data();
      const key = `${shooterData.name}_${shooterData.clubId}`;
      if (nameMap.has(key)) {
        results.issues.push(`Duplikat: ${shooterData.name} in ${clubsMap.get(shooterData.clubId)}`);
      } else {
        nameMap.set(key, true);
      }
    });
    
    logDebug('✅ VALIDATION: Abgeschlossen');
    
    return NextResponse.json({
      success: true,
      message: 'Validierung abgeschlossen',
      results: results,
      summary: {
        totalShooters: results.shooters.total,
        totalClubs: results.clubs.total,
        clubsWithShooters: results.clubs.withShooters,
        totalTeams: results.teams.total,
        teamsWithShooters: results.teams.withShooters,
        issuesFound: results.issues.length
      }
    });
    
  } catch (error) {
    logError('❌ VALIDATION ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
