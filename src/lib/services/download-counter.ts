import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const COUNTER_DOC_ID = 'app_downloads';
const COUNTER_COLLECTION = 'app_stats';

/**
 * Setzt den Download-Zähler auf einen bestimmten Wert
 * Nur für administrative Zwecke
 */
export async function setDownloadCount(count: number): Promise<void> {
  try {
    const counterRef = adminDb.collection(COUNTER_COLLECTION).doc(COUNTER_DOC_ID);
    await counterRef.set({ count }, { merge: true });

  } catch (error) {
    console.error('Fehler beim Setzen des Download-Zählers:', error);
    throw error;
  }
}

/**
 * Erhöht den Download-Zähler und gibt die aktuelle Anzahl zurück
 */
export async function incrementDownloadCounter(): Promise<number> {
  try {
    const counterRef = adminDb.collection(COUNTER_COLLECTION).doc(COUNTER_DOC_ID);
    
    // Aktualisiere den Zähler mit Firestore-Increment
    await counterRef.set({ count: FieldValue.increment(1) }, { merge: true });
    
    // Hole den aktuellen Wert
    const updatedDoc = await counterRef.get();
    return updatedDoc.data()?.count || 0;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Download-Zählers:', error);
    return 0;
  }
}

/**
 * Gibt den aktuellen Wert des Download-Zählers zurück
 */
export async function getDownloadCount(): Promise<number> {
  try {
    const counterRef = adminDb.collection(COUNTER_COLLECTION).doc(COUNTER_DOC_ID);
    const counterDoc = await counterRef.get();
    
    if (counterDoc.exists) {
      return counterDoc.data()?.count || 0;
    } else {
      // Erstelle das Dokument, falls es noch nicht existiert
      await counterRef.set({ count: 0 });
      return 0;
    }
  } catch (error) {
    console.error('Fehler beim Abrufen des Download-Zählers:', error);
    return 0;
  }
}