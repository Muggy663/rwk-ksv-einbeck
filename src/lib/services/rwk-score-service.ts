import { db } from '@/lib/firebase/config';
import { logError, logInfo, logWarn, logDebug } from '@/lib/utils/secure-logger';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { createAuditEntry } from './audit-service';
import { batchGetShooters, batchGetClubs } from '@/lib/utils/batch-reads';

export interface RWKScoreData {
  shooterId: string;
  teamId: string;
  leagueId?: string;
  score: number;
  durchgang: number;
  competitionYear: number;
  createdBy: string;
  resultType?: 'regular' | 'pre' | 'post';
}

/**
 * Speichert ein RWK-Ergebnis und erstellt einen detaillierten Audit-Log-Eintrag
 * für E-Mail-Benachrichtigungen
 */
export async function saveRWKScore(scoreData: RWKScoreData, userInfo: { userId: string; userName: string }) {
  try {
    // Lade alle notwendigen Daten für den Audit-Log
    const [shooterDoc, teamDoc] = await Promise.all([
      getDoc(doc(db, 'shooters', scoreData.shooterId)),
      getDoc(doc(db, 'rwk_teams', scoreData.teamId))
    ]);

    const shooterName = shooterDoc.exists() ? shooterDoc.data()?.name || 'Unbekannter Schütze' : 'Unbekannter Schütze';
    const teamData = teamDoc.exists() ? teamDoc.data() : null;
    const teamName = teamData?.name || 'Unbekannte Mannschaft';

    // Lade Liga-Daten und Vereins-Daten parallel
    let leagueName = 'Unbekannte Liga';
    let clubName = 'Unbekannter Verein';
    
    const [leagueResult, clubResult] = await Promise.all([
      teamData?.leagueId ? getDoc(doc(db, 'rwk_leagues', teamData.leagueId)).catch(() => null) : Promise.resolve(null),
      teamData?.clubId ? getDoc(doc(db, 'clubs', teamData.clubId)).catch(() => null) : Promise.resolve(null)
    ]);
    
    if (leagueResult?.exists()) {
      leagueName = leagueResult.data()?.name || leagueName;
    }
    
    if (clubResult?.exists()) {
      clubName = clubResult.data()?.name || clubName;
    }

    // Speichere das Ergebnis
    const scoreEntry = {
      ...scoreData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'rwk_scores'), scoreEntry);

    // Erstelle detaillierten Audit-Log-Eintrag
    await createAuditEntry(
      'create',
      'score',
      docRef.id,
      {
        after: scoreData,
        description: `Ergebnis erfasst: ${shooterName} - ${scoreData.score} Ringe (DG ${scoreData.durchgang})`
      },
      {
        leagueId: teamData?.leagueId,
        leagueName,
        teamId: scoreData.teamId,
        teamName,
        shooterId: scoreData.shooterId,
        shooterName,
        userId: userInfo.userId,
        userName: userInfo.userName
      }
    );

    logInfo(`RWK-Ergebnis gespeichert: ${shooterName} - ${scoreData.score} Ringe (${teamName}, DG ${scoreData.durchgang})`);

    return {
      success: true,
      scoreId: docRef.id,
      message: `Ergebnis für ${shooterName} erfolgreich gespeichert`
    };

  } catch (error) {
    logError('Fehler beim Speichern des RWK-Ergebnisses:', error);
    throw error;
  }
}

/**
 * Speichert mehrere RWK-Ergebnisse ATOMAR über einen Firestore-writeBatch.
 *
 * Wichtig gegenüber der früheren Version: Die Ergebnisse werden nicht mehr
 * einzeln per addDoc geschrieben (was bei einem Abbruch mitten im Vorgang zu
 * teils gespeicherten, teils fehlenden Ergebnissen führte, obwohl die Funktion
 * "success: true" meldete). Ein writeBatch schreibt entweder ALLE Ergebnisse
 * oder KEINES — es gibt keinen inkonsistenten Zwischenzustand mehr.
 *
 * Die Audit-Logs (nur für Historie/E-Mail-Benachrichtigung) werden NACH dem
 * erfolgreichen Score-Commit geschrieben. Schlägt ein Audit-Eintrag fehl, ist
 * das Ergebnis trotzdem sicher gespeichert; der Audit-Fehler wird nur geloggt
 * und verfälscht das Erfolgs-Reporting nicht.
 */
export async function saveRWKScoresBatch(scores: RWKScoreData[], userInfo: { userId: string; userName: string }) {
  if (scores.length === 0) {
    return { success: true, results: [], message: 'Keine Ergebnisse zu speichern' };
  }

  try {
    // 🚀 Batch-Load aller Shooter und Teams auf einmal (nur für Namen/Audit-Kontext)
    const shooterIds = [...new Set(scores.map(s => s.shooterId))];
    const teamIds = [...new Set(scores.map(s => s.teamId))];

    logDebug(`📦 Batch loading ${shooterIds.length} shooters and ${teamIds.length} teams...`);

    const [shootersMap, teamsSnapshot] = await Promise.all([
      batchGetShooters(shooterIds),
      getDocs(query(collection(db, 'rwk_teams'), where('__name__', 'in', teamIds.slice(0, 30))))
    ]);

    const teamsMap = new Map();
    teamsSnapshot.docs.forEach(d => {
      teamsMap.set(d.id, { id: d.id, ...d.data() });
    });

    const clubIds = [...new Set(Array.from(teamsMap.values()).map((t: any) => t.clubId).filter(Boolean))];
    const clubsMap = await batchGetClubs(clubIds);

    logDebug(`✅ Loaded ${shootersMap.size} shooters, ${teamsMap.size} teams, ${clubsMap.size} clubs in batch`);

    // Score-Dokumente vorbereiten: docRef vorab erzeugen, damit wir die IDs schon
    // vor dem Commit kennen (für Audit-Log und Ergebnis-Rückgabe).
    const prepared = scores.map(scoreData => {
      const shooter = shootersMap.get(scoreData.shooterId);
      const team = teamsMap.get(scoreData.teamId);
      return {
        scoreData,
        ref: doc(collection(db, 'rwk_scores')),
        shooterName: shooter?.name || 'Unbekannter Schütze',
        teamName: team?.name || 'Unbekannte Mannschaft',
        leagueId: team?.leagueId as string | undefined,
      };
    });

    // Atomar schreiben. Firestore erlaubt max. 500 Operationen pro Batch — in
    // 450er-Blöcke aufteilen, damit auch große Importe sicher durchlaufen.
    const CHUNK = 450;
    for (let i = 0; i < prepared.length; i += CHUNK) {
      const batch = writeBatch(db);
      for (const p of prepared.slice(i, i + CHUNK)) {
        batch.set(p.ref, {
          ...p.scoreData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    // Ab hier gelten alle Ergebnisse als gespeichert (Commit war erfolgreich).
    const results = prepared.map(p => ({
      success: true,
      scoreId: p.ref.id,
      message: `Ergebnis für ${p.shooterName} erfolgreich gespeichert`,
    }));

    // Audit-Logs nachziehen (best effort — verfälscht das Erfolgs-Reporting nicht).
    let auditFehler = 0;
    for (const p of prepared) {
      try {
        await createAuditEntry(
          'create',
          'score',
          p.ref.id,
          {
            after: p.scoreData,
            description: `Ergebnis erfasst: ${p.shooterName} - ${p.scoreData.score} Ringe (DG ${p.scoreData.durchgang})`,
          },
          {
            leagueId: p.leagueId,
            leagueName: 'Liga',
            teamId: p.scoreData.teamId,
            teamName: p.teamName,
            shooterId: p.scoreData.shooterId,
            shooterName: p.shooterName,
            userId: userInfo.userId,
            userName: userInfo.userName,
          }
        );
      } catch (auditError) {
        auditFehler++;
        logError('Audit-Log für Ergebnis fehlgeschlagen (Ergebnis wurde trotzdem gespeichert):', auditError);
      }
    }
    if (auditFehler > 0) {
      logWarn(`${auditFehler} von ${prepared.length} Audit-Einträgen fehlgeschlagen — Ergebnisse sind dennoch gespeichert.`);
    }

    logInfo(`Batch von ${scores.length} RWK-Ergebnissen atomar gespeichert`);

    return {
      success: true,
      results,
      message: `${scores.length} Ergebnisse erfolgreich gespeichert`,
    };

  } catch (error) {
    // writeBatch ist atomar: Bei einem Fehler wurde NICHTS gespeichert.
    logError('Fehler beim Speichern des RWK-Ergebnis-Batches (nichts gespeichert):', error);
    return {
      success: false,
      results: scores.map(s => ({
        success: false,
        scoreId: null,
        message: `Nicht gespeichert (${s.shooterId}, DG ${s.durchgang})`,
      })),
      message: `Ergebnisse konnten nicht gespeichert werden: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Hilfsfunktion zum Validieren von RWK-Ergebnissen
 */
export function validateRWKScore(scoreData: RWKScoreData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!scoreData.shooterId) {
    errors.push('Schütze-ID ist erforderlich');
  }

  if (!scoreData.teamId) {
    errors.push('Team-ID ist erforderlich');
  }

  if (!scoreData.score || scoreData.score < 0 || scoreData.score > 400) {
    errors.push('Ungültiger Ringwert (0-400 erlaubt)');
  }

  if (!scoreData.durchgang || scoreData.durchgang < 1 || scoreData.durchgang > 5) {
    errors.push('Ungültiger Durchgang (1-5 erlaubt)');
  }

  if (!scoreData.competitionYear || scoreData.competitionYear < 2020 || scoreData.competitionYear > 2030) {
    errors.push('Ungültiges Wettkampfjahr');
  }

  if (!scoreData.createdBy) {
    errors.push('Benutzer-ID ist erforderlich');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
