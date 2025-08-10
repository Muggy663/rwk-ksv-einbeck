import { db } from '@/lib/firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  doc,
  addDoc,
  Timestamp
} from 'firebase/firestore';

export interface RecoveryResult {
  teamsRecovered: number;
  shootersRecovered: number;
  connectionsRecovered: number;
  errors: string[];
}

/**
 * Versucht gelöschte Team-Schützen-Verknüpfungen basierend auf vorhandenen Ergebnissen wiederherzustellen
 */
export async function recoverTeamShooterConnections(clubId: string): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    teamsRecovered: 0,
    shootersRecovered: 0,
    connectionsRecovered: 0,
    errors: []
  };

  try {
    // 1. Alle Ergebnisse für den Verein finden
    const scoresQuery = query(collection(db, 'rwk_scores'));
    const scoresSnapshot = await getDocs(scoresQuery);
    
    // 2. Alle Teams des Vereins laden
    const teamsQuery = query(collection(db, 'rwk_teams'), where('clubId', '==', clubId));
    const teamsSnapshot = await getDocs(teamsQuery);
    const teamIds = new Set(teamsSnapshot.docs.map(doc => doc.id));
    
    // 3. Alle Schützen des Vereins laden
    const shootersQuery = query(collection(db, 'shooters'), where('clubId', '==', clubId));
    const shootersSnapshot = await getDocs(shootersQuery);
    const shooterIds = new Set(shootersSnapshot.docs.map(doc => doc.id));
    
    // 4. Bestehende Team-Schützen-Verknüpfungen laden
    const existingConnectionsQuery = query(collection(db, 'rwk_team_shooters'));
    const existingConnectionsSnapshot = await getDocs(existingConnectionsQuery);
    const existingConnections = new Set();
    
    existingConnectionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      existingConnections.add(`${data.teamId}_${data.shooterId}`);
    });
    
    // 5. Fehlende Verknüpfungen aus Ergebnissen ableiten
    const missingConnections = new Map<string, {teamId: string, shooterId: string}>();
    
    scoresSnapshot.docs.forEach(scoreDoc => {
      const scoreData = scoreDoc.data();
      const teamId = scoreData.teamId;
      const shooterId = scoreData.shooterId;
      
      // Nur für Teams und Schützen des ausgewählten Vereins
      if (teamIds.has(teamId) && shooterIds.has(shooterId)) {
        const connectionKey = `${teamId}_${shooterId}`;
        
        if (!existingConnections.has(connectionKey)) {
          missingConnections.set(connectionKey, { teamId, shooterId });
        }
      }
    });
    
    // 6. Fehlende Verknüpfungen wiederherstellen
    const batch = writeBatch(db);
    let batchCount = 0;
    
    for (const [connectionKey, connection] of missingConnections.entries()) {
      try {
        const newConnectionRef = doc(collection(db, 'rwk_team_shooters'));
        batch.set(newConnectionRef, {
          teamId: connection.teamId,
          shooterId: connection.shooterId,
          createdAt: Timestamp.now(),
          recoveredAt: Timestamp.now(),
          recoveredBy: 'data-recovery-script'
        });
        
        batchCount++;
        result.connectionsRecovered++;
        
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      } catch (error) {
        result.errors.push(`Fehler beim Wiederherstellen der Verknüpfung ${connectionKey}: ${error}`);
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // 7. Team shooterIds Arrays aktualisieren
    const teamUpdates = new Map<string, string[]>();
    
    // Alle aktuellen Verknüpfungen sammeln (inklusive wiederhergestellte)
    const allConnectionsQuery = query(collection(db, 'rwk_team_shooters'));
    const allConnectionsSnapshot = await getDocs(allConnectionsQuery);
    
    allConnectionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const teamId = data.teamId;
      const shooterId = data.shooterId;
      
      if (teamIds.has(teamId)) {
        if (!teamUpdates.has(teamId)) {
          teamUpdates.set(teamId, []);
        }
        teamUpdates.get(teamId)!.push(shooterId);
      }
    });
    
    // Teams mit korrigierten shooterIds aktualisieren
    const updateBatch = writeBatch(db);
    let updateBatchCount = 0;
    
    for (const [teamId, shooterIdsList] of teamUpdates.entries()) {
      const teamRef = doc(db, 'rwk_teams', teamId);
      updateBatch.update(teamRef, {
        shooterIds: [...new Set(shooterIdsList)], // Duplikate entfernen
        lastUpdated: Timestamp.now(),
        recoveredAt: Timestamp.now()
      });
      
      updateBatchCount++;
      result.teamsRecovered++;
      
      if (updateBatchCount >= 450) {
        await updateBatch.commit();
        updateBatchCount = 0;
      }
    }
    
    if (updateBatchCount > 0) {
      await updateBatch.commit();
    }
    
  } catch (error) {
    result.errors.push(`Allgemeiner Fehler bei der Wiederherstellung: ${error}`);
  }
  
  return result;
}

/**
 * Überprüft die Integrität der Daten nach der Wiederherstellung
 */
export async function verifyDataIntegrity(clubId: string): Promise<{
  totalScores: number;
  connectedScores: number;
  orphanedScores: number;
  teamsWithShooters: number;
  teamsWithoutShooters: number;
}> {
  // Alle Ergebnisse für den Verein
  const scoresQuery = query(collection(db, 'rwk_scores'));
  const scoresSnapshot = await getDocs(scoresQuery);
  
  // Teams des Vereins
  const teamsQuery = query(collection(db, 'rwk_teams'), where('clubId', '==', clubId));
  const teamsSnapshot = await getDocs(teamsQuery);
  const teamIds = new Set(teamsSnapshot.docs.map(doc => doc.id));
  
  // Schützen des Vereins
  const shootersQuery = query(collection(db, 'shooters'), where('clubId', '==', clubId));
  const shootersSnapshot = await getDocs(shootersQuery);
  const shooterIds = new Set(shootersSnapshot.docs.map(doc => doc.id));
  
  // Team-Schützen-Verknüpfungen
  const connectionsQuery = query(collection(db, 'rwk_team_shooters'));
  const connectionsSnapshot = await getDocs(connectionsQuery);
  const connections = new Set();
  
  connectionsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    connections.add(`${data.teamId}_${data.shooterId}`);
  });
  
  let totalScores = 0;
  let connectedScores = 0;
  let orphanedScores = 0;
  
  scoresSnapshot.docs.forEach(scoreDoc => {
    const data = scoreDoc.data();
    const teamId = data.teamId;
    const shooterId = data.shooterId;
    
    if (teamIds.has(teamId) && shooterIds.has(shooterId)) {
      totalScores++;
      
      if (connections.has(`${teamId}_${shooterId}`)) {
        connectedScores++;
      } else {
        orphanedScores++;
      }
    }
  });
  
  let teamsWithShooters = 0;
  let teamsWithoutShooters = 0;
  
  teamsSnapshot.docs.forEach(teamDoc => {
    const teamData = teamDoc.data();
    const shooterIds = teamData.shooterIds || [];
    
    if (shooterIds.length > 0) {
      teamsWithShooters++;
    } else {
      teamsWithoutShooters++;
    }
  });
  
  return {
    totalScores,
    connectedScores,
    orphanedScores,
    teamsWithShooters,
    teamsWithoutShooters
  };
}
