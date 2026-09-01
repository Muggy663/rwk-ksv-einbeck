import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { logDebug, logError } from '@/lib/utils/secure-logger';

export async function POST(request: NextRequest) {
  try {
    const { teamId, shooterId, durchgang, totalRinge, scoreInputType, competitionYear, leagueId, enteredByUserId, enteredByUserName } = await request.json();

    // Prüfe aktive Substitution im Team
    const teamDoc = await adminDb.collection('rwk_teams').doc(teamId).get();
    
    if (!teamDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Team nicht gefunden'
      }, { status: 404 });
    }

    const teamData = teamDoc.data();
    const substitutions = teamData?.substitutions || [];
    
    // Finde aktive Substitution für diesen Schützen und Durchgang
    const activeSubstitution = substitutions.find((sub: any) => 
      sub.originalShooterId === shooterId && 
      sub.active && 
      parseInt(durchgang) >= sub.fromRound
    );

    let actualShooterId = shooterId;
    let isSubstituted = false;
    
    if (activeSubstitution) {
      actualShooterId = activeSubstitution.replacementShooterId;
      isSubstituted = true;
      logDebug(`🔄 Substitution aktiv: ${shooterId} → ${actualShooterId} ab DG${activeSubstitution.fromRound}`);
    }

    // Lade Schützen-Daten
    const shooterDoc = await adminDb.collection('shooters').doc(actualShooterId).get();
    
    if (!shooterDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Schütze nicht gefunden'
      }, { status: 404 });
    }

    const shooterData = shooterDoc.data();

    // Erstelle Ergebnis-Eintrag
    const scoreEntry = {
      teamId,
      teamName: teamData?.name,
      leagueId,
      leagueName: teamData?.leagueName,
      shooterId: actualShooterId,
      shooterName: shooterData?.name,
      durchgang: parseInt(durchgang),
      totalRinge: parseInt(totalRinge),
      scoreInputType: scoreInputType || 'regular',
      competitionYear: parseInt(competitionYear),
      entryTimestamp: (adminDb as any).FieldValue.serverTimestamp(),
      enteredByUserId,
      enteredByUserName,
      // Markiere als Substitution falls zutreffend
      ...(isSubstituted && {
        isSubstitutedResult: true,
        originalShooterId: shooterId,
        substitutionFromRound: activeSubstitution.fromRound,
        substitutionNote: `Ersatz ab DG${activeSubstitution.fromRound}`
      })
    };

    // Speichere Ergebnis
    const docRef = await adminDb.collection('rwk_scores').add(scoreEntry);

    // Erstelle League Update
    await adminDb.collection('league_updates').add({
      leagueType: teamData?.leagueType,
      leagueName: teamData?.leagueName,
      competitionYear: parseInt(competitionYear),
      leagueId,
      timestamp: (adminDb as any).FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      scoreId: docRef.id,
      actualShooterId,
      isSubstituted,
      message: isSubstituted 
        ? `Ergebnis für Ersatzschützen ${shooterData?.name} gespeichert (ab DG${activeSubstitution.fromRound})`
        : 'Ergebnis erfolgreich gespeichert'
    });

  } catch (error) {
    logError('Fehler beim Speichern des Ergebnisses:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler'
    }, { status: 500 });
  }
}