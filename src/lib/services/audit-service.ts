import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

/**
 * Erstellt einen Audit-Eintrag in der Datenbank
 * 
 * @param action - Die durchgeführte Aktion (create, update, delete)
 * @param entityType - Der Typ der Entität (score, team, shooter, etc.)
 * @param entityId - Die ID der Entität
 * @param details - Details zur Änderung
 * @param metadata - Zusätzliche Metadaten (leagueId, teamId, etc.)
 * @returns Die ID des erstellten Audit-Eintrags
 */
export async function createAuditEntry(
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityId: string,
  details: {
    before?: any;
    after?: any;
    description?: string;
  },
  metadata?: {
    leagueId?: string;
    leagueName?: string;
    teamId?: string;
    teamName?: string;
    shooterId?: string;
    shooterName?: string;
    userId?: string;
    userName?: string;
  }
) {
  try {
    // Hole den aktuellen Benutzer
    let userId = metadata?.userId || 'system';
    let userName = metadata?.userName || 'System';
    
    // Erstelle den Audit-Eintrag
    const auditEntry = {
      timestamp: serverTimestamp(),
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      ...metadata
    };
    
    // Speichere den Audit-Eintrag in der Datenbank
    const docRef = await addDoc(collection(db, 'audit_logs'), auditEntry);
    
    console.log(`Audit-Eintrag erstellt: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Fehler beim Erstellen des Audit-Eintrags:', error);
    throw error;
  }
}

/**
 * Hook zum Erstellen von Audit-Einträgen mit dem aktuellen Benutzer
 */
export function useAudit() {
  const { user } = useAuth();
  
  const logAction = async (
    action: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    details: {
      before?: any;
      after?: any;
      description?: string;
    },
    metadata?: {
      leagueId?: string;
      leagueName?: string;
      teamId?: string;
      teamName?: string;
      shooterId?: string;
      shooterName?: string;
    }
  ) => {
    try {
      return await createAuditEntry(action, entityType, entityId, details, {
        ...metadata,
        userId: user?.uid || 'unknown',
        userName: user?.displayName || user?.email || 'Unbekannter Benutzer'
      });
    } catch (error) {
      console.error('Fehler beim Loggen der Aktion:', error);
      return null;
    }
  };
  
  return { logAction };
}