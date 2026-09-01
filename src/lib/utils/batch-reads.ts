import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logDebug, logWarn } from '@/lib/utils/secure-logger';

/**
 * Lädt mehrere Shooter in einem Batch (max 30 pro Query wegen Firebase Limit)
 * Reduziert Firestore Reads von N auf ceil(N/30)
 */
export async function batchGetShooters(shooterIds: string[]): Promise<Map<string, any>> {
  if (!shooterIds || shooterIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(shooterIds)].filter(Boolean);
  const shooterMap = new Map<string, any>();
  
  // Firebase 'in' Query unterstützt max 30 IDs
  const BATCH_SIZE = 30;
  const batches = [];
  
  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    batches.push(uniqueIds.slice(i, i + BATCH_SIZE));
  }
  
  logDebug(`📦 Batch loading ${uniqueIds.length} shooters in ${batches.length} queries`);
  
  for (const batch of batches) {
    try {
      const q = query(
        collection(db, 'shooters'),
        where(documentId(), 'in', batch)
      );
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        shooterMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    } catch (error) {
      logWarn('Batch get shooters error:', error instanceof Error ? error.message : String(error));
    }
  }
  
  logDebug(`✅ Loaded ${shooterMap.size}/${uniqueIds.length} shooters`);
  return shooterMap;
}

/**
 * Lädt mehrere Clubs in einem Batch
 */
export async function batchGetClubs(clubIds: string[]): Promise<Map<string, any>> {
  if (!clubIds || clubIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(clubIds)].filter(Boolean);
  const clubMap = new Map<string, any>();
  
  const BATCH_SIZE = 30;
  const batches = [];
  
  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    batches.push(uniqueIds.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    try {
      const q = query(
        collection(db, 'clubs'),
        where(documentId(), 'in', batch)
      );
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        clubMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    } catch (error) {
      logWarn('Batch get clubs error:', error instanceof Error ? error.message : String(error));
    }
  }
  
  return clubMap;
}

/**
 * Helper: Extrahiert Shooter-Namen aus Batch-Map
 */
export function getShooterName(shooterId: string, shooterMap: Map<string, any>): string {
  const shooter = shooterMap.get(shooterId);
  if (!shooter) return 'Unbekannt';
  
  return shooter.name || 
         `${shooter.firstName || ''} ${shooter.lastName || ''}`.trim() || 
         'Unbekannt';
}

/**
 * Helper: Extrahiert Club-Namen aus Batch-Map
 */
export function getClubName(clubId: string, clubMap: Map<string, any>): string {
  const club = clubMap.get(clubId);
  return club?.name || 'Unbekannt';
}
