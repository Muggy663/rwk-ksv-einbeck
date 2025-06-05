import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface Update {
  id: string;
  title: string;
  date: Date;
  description: string;
  leagueId: string;
  seasonId: string;
  type: string;
}

export async function fetchLatestUpdates(count: number = 5): Promise<Update[]> {
  try {
    // Abfrage für die letzten Änderungen aus der rwk_updates-Sammlung
    const updatesQuery = query(
      collection(db, 'rwk_updates'),
      orderBy('date', 'desc'),
      limit(count)
    );
    
    const snapshot = await getDocs(updatesQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Unbekannter Titel',
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        description: data.description || '',
        leagueId: data.leagueId || '',
        seasonId: data.seasonId || '',
        type: data.type || 'update'
      };
    });
  } catch (error) {
    console.error('Fehler beim Laden der letzten Updates:', error);
    
    // Fallback zu Beispieldaten, falls ein Fehler auftritt
    return [
      {
        id: '1',
        title: 'Kreisoberliga Luftgewehr',
        date: new Date(),
        description: 'Neue Ergebnisse für Durchgang 3 eingetragen',
        leagueId: '1',
        seasonId: '1',
        type: 'result'
      },
      {
        id: '2',
        title: 'Kreisliga Luftgewehr',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 Tag zurück
        description: 'Neue Ergebnisse für Durchgang 3 eingetragen',
        leagueId: '2',
        seasonId: '1',
        type: 'result'
      },
      {
        id: '3',
        title: 'Kreisoberliga Kleinkaliber',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 Tage zurück
        description: 'Neue Ergebnisse für Durchgang 2 eingetragen',
        leagueId: '3',
        seasonId: '2',
        type: 'result'
      }
    ];
  }
}

export function formatUpdateDate(date: Date): string {
  // Formatiere das Datum im deutschen Format
  return format(date, 'dd.MM.yyyy', { locale: de });
}