// Automatische Synchronisation zwischen km_shooters und shooters
import { doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { db } from '@/lib/firebase/config';

export class ShooterSyncService {
  
  // Schütze in beide Collections erstellen
  static async createShooter(shooterData: any, sourceCollection: 'km_shooters' | 'shooters') {
    const shooterId = shooterData.id || doc(db, 'temp').id;
    
    try {
      const batch = writeBatch(db);
      const timestamp = new Date();
      const data = { ...shooterData, createdAt: timestamp, syncedAt: timestamp };
      
      // In Quell-Collection erstellen
      batch.set(doc(db, sourceCollection, shooterId), data);
      
      // In Ziel-Collection synchronisieren
      const targetCollection = sourceCollection === 'km_shooters' ? 'shooters' : 'km_shooters';
      batch.set(doc(db, targetCollection, shooterId), { ...data, syncedFrom: sourceCollection });
      
      await batch.commit();
      logInfo('✅ Schütze synchronisiert', { shooterId });

      return shooterId;
    } catch (error) {
      logError('❌ Sync-Fehler beim Erstellen:', error);
      throw error;
    }
  }
  
  // Schütze in beide Collections aktualisieren
  static async updateShooter(shooterId: string, updateData: any, sourceCollection: 'km_shooters' | 'shooters') {
    try {
      const syncData = {
        ...updateData,
        updatedAt: new Date(),
        syncedAt: new Date()
      };
      
      // In Quell-Collection aktualisieren
      await updateDoc(doc(db, sourceCollection, shooterId), syncData);
      
      // In Ziel-Collection synchronisieren
      const targetCollection = sourceCollection === 'km_shooters' ? 'shooters' : 'km_shooters';
      try {
        await updateDoc(doc(db, targetCollection, shooterId), {
          ...syncData,
          syncedFrom: sourceCollection
        });
      } catch (targetError) {
        logWarn('Ziel-Collection konnte nicht synchronisiert werden', { data: targetError });
      }

    } catch (error) {
      logError('❌ Sync-Fehler beim Aktualisieren:', error);
      throw error;
    }
  }
  
  // Schütze aus beiden Collections löschen
  static async deleteShooter(shooterId: string, sourceCollection: 'km_shooters' | 'shooters') {
    try {
      // Aus Quell-Collection löschen
      await deleteDoc(doc(db, sourceCollection, shooterId));
      
      // Aus Ziel-Collection synchronisieren
      const targetCollection = sourceCollection === 'km_shooters' ? 'shooters' : 'km_shooters';
      try {
        await deleteDoc(doc(db, targetCollection, shooterId));
      } catch (targetError) {
        logWarn('Ziel-Collection konnte nicht gelöscht werden', { data: targetError });
      }

    } catch (error) {
      logError('❌ Sync-Fehler beim Löschen:', error);
      throw error;
    }
  }
}
