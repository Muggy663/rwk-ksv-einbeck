import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export type AuditAction = 'create' | 'update' | 'delete' | 'view';
export type AuditEntityType = 'score' | 'team' | 'shooter' | 'league' | 'season' | 'club' | 'user';

interface AuditLogEntry {
  timestamp: any; // serverTimestamp()
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: AuditEntityType;
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
 * Protokolliert eine Änderung im Audit-Trail
 */
export async function logAuditEvent({
  action,
  entityType,
  entityId,
  details,
  leagueId,
  leagueName,
  teamId,
  teamName,
  shooterId,
  shooterName
}: {
  action: AuditAction;
  entityType: AuditEntityType;
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
}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('Audit-Log: Kein Benutzer angemeldet');
      return;
    }
    
    const auditEntry: AuditLogEntry = {
      timestamp: serverTimestamp(),
      userId: user.uid,
      userName: user.displayName || user.email || 'Unbekannter Benutzer',
      action,
      entityType,
      entityId,
      details,
      leagueId,
      leagueName,
      teamId,
      teamName,
      shooterId,
      shooterName
    };
    
    await addDoc(collection(db, 'audit_logs'), auditEntry);
    console.log(`Audit-Log erstellt: ${action} auf ${entityType} ${entityId}`);
  } catch (error) {
    console.error('Fehler beim Erstellen des Audit-Logs:', error);
  }
}

/**
 * Protokolliert eine Ergebnisänderung
 */
export async function logScoreChange({
  action,
  scoreId,
  before,
  after,
  leagueId,
  leagueName,
  teamId,
  teamName,
  shooterId,
  shooterName
}: {
  action: AuditAction;
  scoreId: string;
  before?: any;
  after?: any;
  leagueId?: string;
  leagueName?: string;
  teamId?: string;
  teamName?: string;
  shooterId?: string;
  shooterName?: string;
}) {
  let description = '';
  
  if (action === 'create') {
    description = `Neues Ergebnis erstellt: ${after?.totalRinge || 'Unbekannt'} Ringe für Durchgang ${after?.durchgang || 'Unbekannt'}`;
  } else if (action === 'update') {
    description = `Ergebnis geändert: von ${before?.totalRinge || 'Unbekannt'} auf ${after?.totalRinge || 'Unbekannt'} Ringe für Durchgang ${after?.durchgang || 'Unbekannt'}`;
  } else if (action === 'delete') {
    description = `Ergebnis gelöscht: ${before?.totalRinge || 'Unbekannt'} Ringe für Durchgang ${before?.durchgang || 'Unbekannt'}`;
  }
  
  await logAuditEvent({
    action,
    entityType: 'score',
    entityId: scoreId,
    details: {
      before,
      after,
      description
    },
    leagueId,
    leagueName,
    teamId,
    teamName,
    shooterId,
    shooterName
  });
}