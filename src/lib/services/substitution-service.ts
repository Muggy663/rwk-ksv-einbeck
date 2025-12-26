import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { logDebug, logError } from '@/lib/utils/secure-logger';

export interface ActiveSubstitution {
  originalShooterId: string;
  replacementShooterId: string;
  fromRound: number;
  substitutionDate: Date;
  active: boolean;
}

/**
 * Prüft ob für einen Schützen in einem Team eine aktive Substitution existiert
 * und gibt den korrekten Schützen für die Ergebnis-Eingabe zurück
 */
export async function getActiveShooterForResult(
  teamId: string, 
  originalShooterId: string, 
  currentRound: number
): Promise<{ shooterId: string; isSubstituted: boolean; substitutionInfo?: ActiveSubstitution }> {
  try {
    // Lade Team-Dokument um Substitutions zu prüfen
    const teamDoc = await getDoc(doc(db, 'rwk_teams', teamId));
    
    if (!teamDoc.exists()) {
      return { shooterId: originalShooterId, isSubstituted: false };
    }
    
    const teamData = teamDoc.data();
    const substitutions = teamData.substitutions || [];
    
    // Finde aktive Substitution für diesen Schützen und Durchgang
    const activeSubstitution = substitutions.find((sub: ActiveSubstitution) => 
      sub.originalShooterId === originalShooterId && 
      sub.active && 
      currentRound >= sub.fromRound
    );
    
    if (activeSubstitution) {
      logDebug(`🔄 Substitution aktiv: ${originalShooterId} → ${activeSubstitution.replacementShooterId} ab DG${activeSubstitution.fromRound}`);
      
      return {
        shooterId: activeSubstitution.replacementShooterId,
        isSubstituted: true,
        substitutionInfo: activeSubstitution
      };
    }
    
    return { shooterId: originalShooterId, isSubstituted: false };
    
  } catch (error) {
    logError('Fehler beim Prüfen der Substitution:', error);
    // Bei Fehler: Verwende Original-Schützen
    return { shooterId: originalShooterId, isSubstituted: false };
  }
}

/**
 * Hilfsfunktion um Substitutions-Info für Tabellen-Anzeige zu formatieren
 */
export function formatSubstitutionDisplay(
  shooterName: string, 
  substitutionInfo?: ActiveSubstitution,
  originalShooterName?: string
): string {
  if (!substitutionInfo || !originalShooterName) {
    return shooterName;
  }
  
  return `${shooterName}\nErsatz ab DG${substitutionInfo.fromRound} für ${originalShooterName}`;
}