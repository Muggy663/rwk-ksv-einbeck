import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export interface Event {
  id?: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  leagueId: string;
  leagueName: string;
  type: 'durchgang' | 'kreismeisterschaft' | 'sitzung' | 'sonstiges';
  description?: string;
  isKreisverband: boolean;
  createdBy: string;
  createdAt: Date;
}

/**
 * Lädt Termine aus der Datenbank
 * @param startDate - Startdatum für die Filterung
 * @param endDate - Enddatum für die Filterung
 * @param leagueId - Liga-ID für die Filterung
 * @returns Liste der Termine
 */
export async function fetchEvents(
  startDate?: Date,
  endDate?: Date,
  leagueId?: string
): Promise<Event[]> {
  try {
    let eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'asc')
    );
    
    if (startDate) {
      eventsQuery = query(
        eventsQuery,
        where('date', '>=', Timestamp.fromDate(startDate))
      );
    }
    
    if (endDate) {
      eventsQuery = query(
        eventsQuery,
        where('date', '<=', Timestamp.fromDate(endDate))
      );
    }
    
    if (leagueId && leagueId !== 'all') {
      eventsQuery = query(
        eventsQuery,
        where('leagueId', '==', leagueId)
      );
    }
    
    const snapshot = await getDocs(eventsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date.toDate(),
        time: data.time,
        location: data.location,
        leagueId: data.leagueId,
        leagueName: data.leagueName,
        type: data.type,
        description: data.description,
        isKreisverband: data.isKreisverband || false,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate()
      } as Event;
    });
  } catch (error) {
    console.error('Fehler beim Laden der Termine:', error);
    return [];
  }
}

/**
 * Erstellt einen neuen Termin
 * @param event - Termindaten
 * @returns ID des erstellten Termins oder null bei Fehler
 */
export async function createEvent(event: Omit<Event, 'id' | 'createdAt'>): Promise<string | null> {
  try {
    const eventData = {
      ...event,
      date: Timestamp.fromDate(event.date),
      createdAt: Timestamp.fromDate(new Date())
    };
    
    const docRef = await addDoc(collection(db, 'events'), eventData);
    return docRef.id;
  } catch (error) {
    console.error('Fehler beim Erstellen des Termins:', error);
    return null;
  }
}

/**
 * Aktualisiert einen Termin
 * @param id - ID des Termins
 * @param event - Zu aktualisierende Termindaten
 * @returns Erfolg der Aktualisierung
 */
export async function updateEvent(id: string, event: Partial<Event>): Promise<boolean> {
  try {
    const eventData = { ...event };
    
    if (event.date) {
      eventData.date = Timestamp.fromDate(event.date);
    }
    
    await updateDoc(doc(db, 'events', id), eventData);
    return true;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Termins:', error);
    return false;
  }
}

/**
 * Löscht einen Termin
 * @param id - ID des Termins
 * @returns Erfolg des Löschvorgangs
 */
export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'events', id));
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen des Termins:', error);
    return false;
  }
}

/**
 * Generiert einen iCal-Eintrag für einen Termin
 * @param event - Termindaten
 * @returns iCal-Daten als String
 */
export function generateICalEvent(event: Event): string {
  const dateStart = format(event.date, 'yyyyMMdd');
  const timeStart = event.time.replace(':', '') + '00';
  
  // Endzeit ist 2 Stunden nach Startzeit
  const [hours, minutes] = event.time.split(':').map(Number);
  const endHours = hours + 2;
  const timeEnd = `${endHours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
  
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RWK Einbeck App//DE\nCALSCALE:GREGORIAN\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART:${dateStart}T${timeStart}\nDTEND:${dateStart}T${timeEnd}\nLOCATION:${event.location}\nDESCRIPTION:${event.description || ''}\nSTATUS:CONFIRMED\nSEQUENCE:0\nDTSTAMP:${now}\nCREATED:${now}\nEND:VEVENT\nEND:VCALENDAR`;
}

/**
 * Generiert eine iCal-Datei für mehrere Termine
 * @param events - Liste der Termine
 * @returns iCal-Daten als String
 */
export function generateICalFile(events: Event[]): string {
  let icalContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RWK Einbeck App//DE\nCALSCALE:GREGORIAN\n`;
  
  events.forEach(event => {
    const dateStart = format(event.date, 'yyyyMMdd');
    const timeStart = event.time.replace(':', '') + '00';
    
    // Endzeit ist 2 Stunden nach Startzeit
    const [hours, minutes] = event.time.split(':').map(Number);
    const endHours = hours + 2;
    const timeEnd = `${endHours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
    
    const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    
    icalContent += `BEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART:${dateStart}T${timeStart}\nDTEND:${dateStart}T${timeEnd}\nLOCATION:${event.location}\nDESCRIPTION:${event.description || ''}\nSTATUS:CONFIRMED\nSEQUENCE:0\nDTSTAMP:${now}\nCREATED:${now}\nEND:VEVENT\n`;
  });
  
  icalContent += 'END:VCALENDAR';
  
  return icalContent;
}