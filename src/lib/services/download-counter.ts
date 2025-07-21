import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

const COUNTER_DOC_ID = 'app_downloads';
const COUNTER_COLLECTION = 'app_stats';

/**
 * Erhöht den Download-Zähler und gibt die aktuelle Anzahl zurück
 */
export async function incrementDownloadCounter(): Promise<number> {
  try {
    const counterRef = doc(db, COUNTER_COLLECTION, COUNTER_DOC_ID);
    
    // Aktualisiere den Zähler mit Firestore-Increment
    await setDoc(counterRef, { count: increment(1) }, { merge: true });
    
    // Hole den aktuellen Wert
    const updatedDoc = await getDoc(counterRef);
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
    const counterRef = doc(db, COUNTER_COLLECTION, COUNTER_DOC_ID);
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      return counterDoc.data().count || 0;
    } else {
      // Erstelle das Dokument, falls es noch nicht existiert
      await setDoc(counterRef, { count: 0 });
      return 0;
    }
  } catch (error) {
    console.error('Fehler beim Abrufen des Download-Zählers:', error);
    return 0;
  }
}