/**
 * Migration Script: RWK Scores nach Saison aufteilen
 * 
 * Kopiert bestehende rwk_scores in saison-spezifische Collections
 * ACHTUNG: Nur auf localhost ausführen!
 */

import { getApps, getApp } from 'firebase/app';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

// Verwende bestehende Firebase App
const app = getApps().length > 0 ? getApp() : null;
if (!app) {
  throw new Error('Firebase App nicht initialisiert. Bitte zuerst die Hauptanwendung laden.');
}
const databaseId = process.env.FIREBASE_DATABASE_ID || 'restored-main';
const db = getFirestore(app, databaseId);

interface RWKScore {
  seasonId: string;
  seasonName: string;
  leagueType: string;
  competitionYear: number;
  [key: string]: any;
}

async function migrateRWKScores() {
  // Sicherheitscheck
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    throw new Error('🚫 Migration nur auf localhost erlaubt!');
  }

  logDebug('🚀 Starte RWK Scores Migration...');

  try {
    // 1. Alle bestehenden Scores laden
    logDebug('📖 Lade bestehende rwk_scores...');
    const scoresRef = collection(db, 'rwk_scores');
    const snapshot = await getDocs(scoresRef);
    
    const allScores: (RWKScore & { id: string })[] = [];
    snapshot.forEach(doc => {
      allScores.push({ id: doc.id, ...doc.data() as RWKScore });
    });

    logDebug(`✅ ${allScores.length} Scores gefunden`);

    // 2. Nach Jahr+Disziplin gruppieren
    const scoresByYearDiscipline = new Map<string, (RWKScore & { id: string })[]>();
    
    allScores.forEach(score => {
      const year = score.competitionYear || new Date().getFullYear();
      const leagueType = score.leagueType || 'UNKNOWN';
      
      // Normalisiere Disziplin
      let normalizedDiscipline = leagueType;
      if (['KK', 'KKG'].includes(leagueType)) {
        normalizedDiscipline = 'KK';
      } else if (['LG', 'LGA', 'LP', 'LPA'].includes(leagueType)) {
        normalizedDiscipline = 'LD';
      }
      
      const key = `${year}_${normalizedDiscipline}`;
      
      if (!scoresByYearDiscipline.has(key)) {
        scoresByYearDiscipline.set(key, []);
      }
      scoresByYearDiscipline.get(key)!.push(score);
    });

    logDebug(`📊 ${scoresByYearDiscipline.size} verschiedene Jahr-Disziplin Kombinationen gefunden:`);
    
    // 3. Für jede Jahr-Disziplin Kombination neue Collection erstellen
    for (const [yearDiscipline, scores] of scoresByYearDiscipline) {
      const collectionName = `rwk_scores_${yearDiscipline}`;
      const sampleScore = scores[0];
      
      logDebug(`\n🏆 ${yearDiscipline}: ${sampleScore.seasonName || 'Unbekannt'}`);
      logDebug(`📁 Collection: ${collectionName}`);
      logDebug(`📈 Anzahl Scores: ${scores.length}`);

      // Batch-Write für bessere Performance
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let batchCount = 0;

      for (const score of scores) {
        const newDocRef = doc(db, collectionName, score.id);
        
        // Entferne die ID aus den Daten (wird als Document-ID verwendet)
        const { id, ...scoreData } = score;
        currentBatch.set(newDocRef, scoreData);
        
        batchCount++;
        
        // Firebase Batch-Limit: 500 Operationen
        if (batchCount >= 500) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          batchCount = 0;
        }
      }
      
      // Letzten Batch hinzufügen falls nicht leer
      if (batchCount > 0) {
        batches.push(currentBatch);
      }

      // Alle Batches ausführen
      logDebug(`💾 Schreibe ${batches.length} Batch(es)...`);
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        logDebug(`✅ Batch ${i + 1}/${batches.length} geschrieben`);
      }
    }

    logDebug('\n🎉 Migration erfolgreich abgeschlossen!');
    logDebug('\n📋 Zusammenfassung:');
    scoresByYearDiscipline.forEach((scores, yearDiscipline) => {
      const sampleScore = scores[0];
      logDebug(`  • ${sampleScore.seasonName}: ${scores.length} Scores → rwk_scores_${yearDiscipline}`);
    });

    logDebug('\n⚠️ WICHTIG: Original rwk_scores Collection bleibt unverändert als Backup!');

  } catch (error) {
    logError('❌ Migration fehlgeschlagen:', error);
    throw error;
  }
}

// Export für Verwendung in der App
export { migrateRWKScores };

// Direkte Ausführung wenn als Script gestartet
if (require.main === module) {
  migrateRWKScores()
    .then(() => {
      logDebug('✅ Script beendet');
      process.exit(0);
    })
    .catch((error) => {
      logError('❌ Script fehlgeschlagen:', error);
      process.exit(1);
    });
}