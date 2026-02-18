import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  let hartmutScoresSnapshot = null;
  
  try {
    const { substitutionId } = await request.json();
    
    if (substitutionId === 'kSFh1TtpCIQjheWJRO1q') {
      const batch = adminDb.batch();
      
      // 1. Korrigiere fromRound von 13 auf 3
      const substitutionRef = adminDb.collection('team_substitutions').doc(substitutionId);
      batch.update(substitutionRef, {
        fromRound: 3
      });
      
      // 2. Kopiere Hartmuts Ergebnisse (DG1 und DG2) für Martin (Hartmut behält seine als Einzelschütze)
      const hartmutScoresQuery = adminDb.collection('rwk_scores')
        .where('shooterId', '==', 'YEPNbpcAmAsSyhVmKY8V') // Hartmut Kahl
        .where('teamId', '==', 'PDmEKXGIUunJ5zcd5g1d') // SGi Einbeck e.V. I
        .where('competitionYear', '==', 2026)
        .where('durchgang', '<', 3); // DG1 und DG2
      
      hartmutScoresSnapshot = await hartmutScoresQuery.get();
    
      hartmutScoresSnapshot.docs.forEach(scoreDoc => {
        const scoreData = scoreDoc.data();
        const newScoreRef = adminDb.collection('rwk_scores').doc();
      
        // Erstelle neue Ergebnisse für Martin (Kopie von Hartmuts Ergebnissen)
        batch.set(newScoreRef, {
          ...scoreData,
          shooterId: 'OjdKVlyNWDIKsyBWuRcc', // Martin Baselt
          shooterName: 'Martin Baselt',
          substitutionCopied: true,
          originalShooterId: 'YEPNbpcAmAsSyhVmKY8V',
          originalShooterName: 'Hartmut Kahl',
          copiedAt: FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return NextResponse.json({ 
        success: true, 
        message: `Substitution repariert. fromRound: 13→3, ${hartmutScoresSnapshot?.size || 0} Ergebnisse für Martin kopiert. Hartmut behält seine als Einzelschütze.`
      });
    }
    
    return NextResponse.json({ error: 'Ungültige Substitution ID' }, { status: 400 });
    
  } catch (error) {
    logError('Repair-Fehler:', error);
    return NextResponse.json({ 
      error: 'Reparatur fehlgeschlagen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  } finally {
    hartmutScoresSnapshot = null;
  }
}