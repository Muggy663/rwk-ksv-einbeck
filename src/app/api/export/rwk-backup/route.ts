import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let scoresSnapshot = null;
  let teamsSnapshot = null;
  let shootersSnapshot = null;
  let clubsSnapshot = null;
  let leaguesSnapshot = null;
  
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year') || '2025';
    const discipline = url.searchParams.get('discipline') || 'KK';
    
    logDebug(`📊 BACKUP: Exportiere ${discipline} ${year}...`);
    
    // 1. Lade alle Scores für das Jahr und die Disziplin
    scoresSnapshot = await adminDb.collection('rwk_scores')
      .where('competitionYear', '==', parseInt(year))
      .get();
    
    // 2. Lade Teams und Schützen
    teamsSnapshot = await adminDb.collection('rwk_teams').get();
    shootersSnapshot = await adminDb.collection('shooters').get();
    clubsSnapshot = await adminDb.collection('clubs').get();
    leaguesSnapshot = await adminDb.collection('rwk_leagues').get();
    // 3. Erstelle Maps für schnelle Lookups
    const teams = new Map();
    teamsSnapshot.docs.forEach(doc => {
      teams.set(doc.id, doc.data());
    });
  
    const shooters = new Map();
    shootersSnapshot.docs.forEach(doc => {
      shooters.set(doc.id, doc.data());
    });
  
    const clubs = new Map();
    clubsSnapshot.docs.forEach(doc => {
      clubs.set(doc.id, doc.data());
    });
  
    const leagues = new Map();
    leaguesSnapshot.docs.forEach(doc => {
      leagues.set(doc.id, doc.data());
    });
  
    // 4. Filtere und verarbeite Scores
    const exportData = [];
    scoresSnapshot.docs.forEach(doc => {
      const score = doc.data();
      const team = teams.get(score.teamId);
      const shooter = shooters.get(score.shooterId);
      const club = clubs.get(score.clubId);
      const league = leagues.get(team?.leagueId);
    
      // Filtere nach Disziplin
      if (league?.type?.includes(discipline) || score.discipline?.includes(discipline)) {
        exportData.push({
          'Schützen-ID': score.shooterId,
          'Schützenname': score.shooterName || shooter?.name,
          'Verein': club?.name || 'Unbekannt',
          'Team': team?.name || 'Unbekannt',
          'Liga': league?.name || 'Unbekannt',
          'Disziplin': league?.type || score.discipline,
          'Durchgang': score.durchgang,
          'Ringe': score.totalRinge,
          'Datum': score.createdAt?.toDate?.()?.toLocaleDateString('de-DE') || 'Unbekannt',
          'Jahr': score.competitionYear,
          'Score-ID': doc.id
        });
      }
    });
  
    logDebug(`📊 BACKUP: ${exportData.length} Einträge gefunden`);
  
    // 5. Erstelle Excel-Datei
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${discipline}_${year}`);
  
    // 6. Generiere Buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="RWK_Backup_${discipline}_${year}.xlsx"`
      }
    });
  } catch (error) {
    logError('❌ BACKUP ERROR:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  } finally {
    scoresSnapshot = null;
    teamsSnapshot = null;
    shootersSnapshot = null;
    clubsSnapshot = null;
    leaguesSnapshot = null;
  }
}
