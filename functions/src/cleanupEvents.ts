import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function, die täglich um Mitternacht ausgeführt wird und abgelaufene Termine löscht.
 * Termine werden gelöscht, wenn sie älter als 24 Stunden sind.
 */
export const cleanupExpiredEvents = functions.pubsub
  .schedule('0 0 * * *') // Jeden Tag um Mitternacht
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    try {
      const db = admin.firestore();
      
      // Berechne das Datum von vor 24 Stunden
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      
      // Konvertiere zu Firestore Timestamp
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(yesterday);
      
      // Finde alle Termine, die älter als 24 Stunden sind
      const expiredEventsQuery = db.collection('events')
        .where('date', '<', cutoffTimestamp);
      
      const expiredEvents = await expiredEventsQuery.get();
      
      if (expiredEvents.empty) {
        console.log('Keine abgelaufenen Termine zum Löschen gefunden.');
        return null;
      }
      
      // Lösche die abgelaufenen Termine in Batches
      const batch = db.batch();
      let count = 0;
      
      expiredEvents.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      
      await batch.commit();
      console.log(`${count} abgelaufene Termine wurden gelöscht.`);
      
      return null;
    } catch (error) {
      console.error('Fehler beim Löschen abgelaufener Termine:', error);
      return null;
    }
  });