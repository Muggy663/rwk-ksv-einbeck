import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Erstellt Beispiel-Audit-Einträge für Testzwecke
 */
export async function createSampleAuditEntries() {
  try {
    const auditCollection = collection(db, 'audit_logs');
    
    // Beispiel-Einträge
    const entries = [
      {
        timestamp: serverTimestamp(),
        userId: 'admin',
        userName: 'Administrator',
        action: 'create',
        entityType: 'team',
        entityId: 'team-123',
        teamName: 'SV Musterstadt 1',
        details: {
          description: 'Neue Mannschaft erstellt: SV Musterstadt 1'
        }
      },
      {
        timestamp: serverTimestamp(),
        userId: 'admin',
        userName: 'Administrator',
        action: 'update',
        entityType: 'shooter',
        entityId: 'shooter-456',
        shooterName: 'Max Mustermann',
        details: {
          description: 'Schütze aktualisiert: Max Mustermann',
          before: { name: 'Max Muster' },
          after: { name: 'Max Mustermann' }
        }
      },
      {
        timestamp: serverTimestamp(),
        userId: 'user-789',
        userName: 'Vereinsvertreter',
        action: 'create',
        entityType: 'score',
        entityId: 'score-789',
        teamName: 'SV Musterstadt 1',
        details: {
          description: 'Neues Ergebnis erfasst: 1. Durchgang'
        }
      },
      {
        timestamp: serverTimestamp(),
        userId: 'user-789',
        userName: 'Vereinsvertreter',
        action: 'update',
        entityType: 'score',
        entityId: 'score-789',
        teamName: 'SV Musterstadt 1',
        details: {
          description: 'Ergebnis korrigiert: 1. Durchgang',
          before: { totalRinge: 280 },
          after: { totalRinge: 285 }
        }
      },
      {
        timestamp: serverTimestamp(),
        userId: 'admin',
        userName: 'Administrator',
        action: 'delete',
        entityType: 'team',
        entityId: 'team-456',
        teamName: 'SV Musterstadt 2',
        details: {
          description: 'Mannschaft gelöscht: SV Musterstadt 2'
        }
      }
    ];
    
    // Einträge in die Datenbank schreiben
    for (const entry of entries) {
      await addDoc(auditCollection, entry);
    }
    
    console.log('Beispiel-Audit-Einträge erstellt');
    return true;
  } catch (error) {
    console.error('Fehler beim Erstellen der Beispiel-Audit-Einträge:', error);
    throw error;
  }
}