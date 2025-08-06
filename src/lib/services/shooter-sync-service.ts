// Automatische Synchronisation zwischen km_shooters und rwk_shooters
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export class ShooterSyncService {
  
  // Schütze in beide Collections erstellen
  static async createShooter(shooterData: any, sourceCollection: 'km_shooters' | 'rwk_shooters') {
    const shooterId = shooterData.id || doc(db, 'temp').id;
    
    try {
      // In Quell-Collection erstellen
      await setDoc(doc(db, sourceCollection, shooterId), {
        ...shooterData,
        createdAt: new Date(),
        syncedAt: new Date()
      });
      
      // In Ziel-Collection synchronisieren
      const targetCollection = sourceCollection === 'km_shooters' ? 'rwk_shooters' : 'km_shooters';
      await setDoc(doc(db, targetCollection, shooterId), {
        ...shooterData,
        createdAt: new Date(),
        syncedAt: new Date(),
        syncedFrom: sourceCollection
      });
      
      console.log(`✅ Schütze ${shooterId} in beiden Collections erstellt`);
      return shooterId;
    } catch (error) {
      console.error('❌ Sync-Fehler beim Erstellen:', error);
      throw error;
    }
  }
  
  // Schütze in beide Collections aktualisieren
  static async updateShooter(shooterId: string, updateData: any, sourceCollection: 'km_shooters' | 'rwk_shooters') {
    try {
      const syncData = {
        ...updateData,
        updatedAt: new Date(),
        syncedAt: new Date()
      };
      
      // In Quell-Collection aktualisieren
      await updateDoc(doc(db, sourceCollection, shooterId), syncData);
      
      // In Ziel-Collection synchronisieren
      const targetCollection = sourceCollection === 'km_shooters' ? 'rwk_shooters' : 'km_shooters';
      await updateDoc(doc(db, targetCollection, shooterId), {
        ...syncData,
        syncedFrom: sourceCollection
      });
      
      console.log(`✅ Schütze ${shooterId} in beiden Collections aktualisiert`);
    } catch (error) {
      console.error('❌ Sync-Fehler beim Aktualisieren:', error);
      throw error;
    }
  }
  
  // Schütze aus beiden Collections löschen
  static async deleteShooter(shooterId: string, sourceCollection: 'km_shooters' | 'rwk_shooters') {
    try {
      // Aus Quell-Collection löschen
      await deleteDoc(doc(db, sourceCollection, shooterId));
      
      // Aus Ziel-Collection synchronisieren
      const targetCollection = sourceCollection === 'km_shooters' ? 'rwk_shooters' : 'km_shooters';
      await deleteDoc(doc(db, targetCollection, shooterId));
      
      console.log(`✅ Schütze ${shooterId} aus beiden Collections gelöscht`);
    } catch (error) {
      console.error('❌ Sync-Fehler beim Löschen:', error);
      throw error;
    }
  }
}