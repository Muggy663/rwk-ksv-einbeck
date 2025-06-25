import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp, writeBatch } from 'firebase/firestore';

/**
 * Löscht Termine, die älter als 24 Stunden sind
 * @returns Anzahl der gelöschten Termine
 */
export async function cleanupExpiredEvents(): Promise<number> {
  try {
    // Berechne das Datum von vor 24 Stunden
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    // Konvertiere zu Firestore Timestamp
    const cutoffTimestamp = Timestamp.fromDate(yesterday);
    
    // Finde alle Termine, die älter als 24 Stunden sind
    const expiredEventsQuery = query(
      collection(db, 'events'),
      where('date', '<', cutoffTimestamp)
    );
    
    const expiredEvents = await getDocs(expiredEventsQuery);
    
    if (expiredEvents.empty) {
      console.log('Keine abgelaufenen Termine zum Löschen gefunden.');
      return 0;
    }
    
    // Lösche die abgelaufenen Termine in Batches
    const batch = writeBatch(db);
    let count = 0;
    
    expiredEvents.forEach(eventDoc => {
      batch.delete(doc(db, 'events', eventDoc.id));
      count++;
    });
    
    await batch.commit();
    console.log(`${count} abgelaufene Termine wurden gelöscht.`);
    
    return count;
  } catch (error) {
    console.error('Fehler beim Löschen abgelaufener Termine:', error);
    return 0;
  }
}