// src/app/api/km/auth/sync-rwk.ts
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

export async function syncRWKUsersToKM() {
  try {
    // Lade alle RWK-Benutzer mit Vereinsvertreter-Rolle
    const rwkUsersSnapshot = await getDocs(collection(db, 'user_permissions'));
    const rwkUsers = rwkUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter(user => user.role === 'vereinsvertreter' && user.isActive);

    let syncedCount = 0;

    for (const rwkUser of rwkUsers) {
      // Prüfe ob KM-Berechtigung bereits existiert
      const kmUserRef = doc(db, 'km_user_permissions', rwkUser.id);
      const kmUserDoc = await getDoc(kmUserRef);

      // Bestimme Vereine (Multi-Verein-Support)
      const kmUserData = {
        role: 'verein_vertreter',
        isActive: rwkUser.isActive,
        syncedFromRWK: true,
        lastSyncAt: new Date()
      };

      // Multi-Verein oder Einzel-Verein
      if (rwkUser.clubIds && Array.isArray(rwkUser.clubIds)) {
        kmUserData.clubIds = rwkUser.clubIds;
      } else if (rwkUser.clubId) {
        kmUserData.clubId = rwkUser.clubId;
      }

      if (!kmUserDoc.exists()) {
        // Erstelle neue KM-Berechtigung
        await setDoc(kmUserRef, {
          ...kmUserData,
          createdAt: new Date()
        });
        syncedCount++;
      } else {
        // Aktualisiere bestehende Berechtigung (nur wenn von RWK synchronisiert)
        const existingData = kmUserDoc.data();
        if (existingData.syncedFromRWK) {
          await setDoc(kmUserRef, {
            ...existingData,
            ...kmUserData
          });
        }
      }
    }

    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('RWK-Sync Fehler:', error);
    return { success: false, error: 'Synchronisation fehlgeschlagen' };
  }
}
