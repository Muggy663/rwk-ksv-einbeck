import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';

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
    

    return docRef.id;
  } catch (error) {
    console.error('Fehler beim Erstellen des Audit-Eintrags:', error);
    throw error;
  }
}

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  details: {
    before?: any;
    after?: any;
    description?: string;
  };
  leagueId?: string;
  leagueName?: string;
  teamId?: string;
  teamName?: string;
  shooterId?: string;
  shooterName?: string;
}

/**
 * Audit-Log Service Klasse
 */
class AuditLogService {
  private collection = 'audit_logs';

  /**
   * Erstelle Audit-Eintrag mit Benutzerinformationen
   */
  async logAction(
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
    },
    userInfo?: {
      userId: string;
      userName: string;
    }
  ): Promise<string | null> {
    try {
      return await createAuditEntry(action, entityType, entityId, details, {
        ...metadata,
        userId: userInfo?.userId || 'system',
        userName: userInfo?.userName || 'System'
      });
    } catch (error) {
      console.error('Fehler beim Loggen der Aktion:', error);
      return null;
    }
  }

  /**
   * Alle Audit-Logs abrufen
   */
  async getAllLogs(limitCount: number = 100): Promise<AuditLogEntry[]> {
    try {
      const logsQuery = query(
        collection(db, this.collection),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(logsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('Fehler beim Laden der Audit-Logs:', error);
      throw error;
    }
  }

  /**
   * Audit-Logs nach Entitätstyp filtern
   */
  async getLogsByEntityType(entityType: string, limitCount: number = 50): Promise<AuditLogEntry[]> {
    try {
      const logsQuery = query(
        collection(db, this.collection),
        where('entityType', '==', entityType),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(logsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('Fehler beim Laden der Audit-Logs nach Typ:', error);
      throw error;
    }
  }

  /**
   * Audit-Logs für bestimmte Entität abrufen
   */
  async getLogsForEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    try {
      const logsQuery = query(
        collection(db, this.collection),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(logsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('Fehler beim Laden der Audit-Logs für Entität:', error);
      throw error;
    }
  }

  /**
   * Audit-Statistiken
   */
  async getAuditStats(): Promise<{
    total: number;
    creates: number;
    updates: number;
    deletes: number;
    byEntityType: Record<string, number>;
  }> {
    try {
      const logs = await this.getAllLogs(1000); // Letzte 1000 Einträge
      
      const stats = {
        total: logs.length,
        creates: logs.filter(log => log.action === 'create').length,
        updates: logs.filter(log => log.action === 'update').length,
        deletes: logs.filter(log => log.action === 'delete').length,
        byEntityType: {} as Record<string, number>
      };
      
      // Zähle nach Entitätstyp
      logs.forEach(log => {
        stats.byEntityType[log.entityType] = (stats.byEntityType[log.entityType] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Fehler beim Laden der Audit-Statistiken:', error);
      throw error;
    }
  }
}

export const auditLogService = new AuditLogService();
