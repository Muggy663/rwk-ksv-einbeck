import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface DatabaseAuditResult {
  collections: {
    [key: string]: {
      count: number;
      sampleData?: any[];
      isEmpty: boolean;
    }
  };
  criticalCollections: {
    [key: string]: boolean; // true = has data, false = empty
  };
}

/**
 * Führt eine vollständige Audit der Datenbank durch
 */
export async function auditDatabase(clubId?: string): Promise<DatabaseAuditResult> {
  const result: DatabaseAuditResult = {
    collections: {},
    criticalCollections: {}
  };

  const collectionsToCheck = [
    'rwk_scores',
    'rwk_team_shooters', 
    'rwk_teams',
    'rwk_shooters',
    'rwk_clubs',
    'rwk_seasons',
    'rwk_leagues'
  ];

  try {
    for (const collectionName of collectionsToCheck) {
      console.log(`Checking collection: ${collectionName}`);
      
      let q = query(collection(db, collectionName));
      
      // Für vereinsspezifische Collections Filter hinzufügen
      if (clubId && ['rwk_teams', 'rwk_shooters'].includes(collectionName)) {
        q = query(collection(db, collectionName), where('clubId', '==', clubId));
      }
      
      const snapshot = await getDocs(q);
      const count = snapshot.size;
      
      // Sample-Daten für Analyse
      const sampleData = snapshot.docs.slice(0, 3).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      result.collections[collectionName] = {
        count,
        sampleData,
        isEmpty: count === 0
      };
      
      result.criticalCollections[collectionName] = count > 0;
    }
    
    // Spezielle Prüfung für Ergebnisse mit Team-Bezug
    if (clubId) {
      const teamsSnapshot = await getDocs(query(collection(db, 'rwk_teams'), where('clubId', '==', clubId)));
      const teamIds = teamsSnapshot.docs.map(doc => doc.id);
      
      if (teamIds.length > 0) {
        // Prüfe Ergebnisse für diese Teams
        const scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('teamId', 'in', teamIds.slice(0, 10)) // Firestore limit
        );
        const scoresSnapshot = await getDocs(scoresQuery);
        
        result.collections['rwk_scores_for_club'] = {
          count: scoresSnapshot.size,
          sampleData: scoresSnapshot.docs.slice(0, 3).map(doc => ({
            id: doc.id,
            ...doc.data()
          })),
          isEmpty: scoresSnapshot.size === 0
        };
      }
    }
    
  } catch (error) {
    console.error('Error during database audit:', error);
    throw error;
  }
  
  return result;
}

/**
 * Prüft ob kritische Daten fehlen
 */
export function analyzeCriticalDataLoss(auditResult: DatabaseAuditResult): {
  severity: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Prüfe kritische Collections
  if (auditResult.collections['rwk_scores']?.isEmpty) {
    issues.push('KRITISCH: Alle Ergebnisse (rwk_scores) wurden gelöscht');
    recommendations.push('Sofortige Wiederherstellung aus Backup erforderlich');
    severity = 'critical';
  }
  
  if (auditResult.collections['rwk_team_shooters']?.isEmpty) {
    issues.push('KRITISCH: Alle Team-Schützen-Verknüpfungen wurden gelöscht');
    recommendations.push('Team-Schützen-Zuordnungen müssen manuell wiederhergestellt werden');
    if (severity !== 'critical') severity = 'high';
  }
  
  if (auditResult.collections['rwk_teams']?.isEmpty) {
    issues.push('KRITISCH: Alle Teams wurden gelöscht');
    recommendations.push('Teams müssen aus Backup oder manuell wiederhergestellt werden');
    severity = 'critical';
  }
  
  if (auditResult.collections['rwk_shooters']?.isEmpty) {
    issues.push('KRITISCH: Alle Schützen wurden gelöscht');
    recommendations.push('Schützen müssen aus Backup wiederhergestellt werden');
    severity = 'critical';
  }
  
  // Prüfe auf inkonsistente Daten
  const scoresCount = auditResult.collections['rwk_scores']?.count || 0;
  const teamShootersCount = auditResult.collections['rwk_team_shooters']?.count || 0;
  
  if (scoresCount > 0 && teamShootersCount === 0) {
    issues.push('INKONSISTENZ: Ergebnisse vorhanden, aber keine Team-Schützen-Verknüpfungen');
    recommendations.push('Team-Schützen-Verknüpfungen aus Ergebnissen rekonstruieren');
    if (severity === 'low') severity = 'medium';
  }
  
  return { severity, issues, recommendations };
}