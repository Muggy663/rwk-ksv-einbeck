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
    // Debug-Ausgabe
    console.log("fetchEvents aufgerufen mit:", 
      startDate ? startDate.toISOString() : "kein Startdatum", 
      endDate ? endDate.toISOString() : "kein Enddatum", 
      leagueId || "keine Liga");
    
    // Basis-Query erstellen
    const eventsRef = collection(db, 'events');
    
    // Queries für verschiedene Filter vorbereiten
    let constraints = [];
    
    // Datum-Filter hinzufügen
    if (startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }
    
    // Liga-Filter hinzufügen
    if (leagueId && leagueId !== 'all') {
      constraints.push(where('leagueId', '==', leagueId));
    }
    
    // Sortierung hinzufügen
    constraints.push(orderBy('date', 'asc'));
    
    // Query ausführen
    const eventsQuery = query(eventsRef, ...constraints);
    const snapshot = await getDocs(eventsQuery);
    
    console.log(`fetchEvents: ${snapshot.docs.length} Termine gefunden`);
    
    // Ergebnisse mappen und filtern
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Datum korrekt konvertieren
      let eventDate;
      try {
        eventDate = data.date?.toDate();
      } catch (error) {
        console.error("Fehler beim Konvertieren des Datums:", error);
        eventDate = new Date();
      }
      
      return {
        id: doc.id,
        title: data.title || 'Unbenannter Termin',
        date: eventDate,
        time: data.time || '00:00',
        location: data.location || 'Kein Ort angegeben',
        leagueId: data.leagueId || '',
        leagueName: data.leagueName || '',
        type: data.type || 'sonstiges',
        description: data.description || '',
        isKreisverband: data.isKreisverband || false,
        createdBy: data.createdBy || '',
        createdAt: data.createdAt?.toDate() || new Date()
      } as Event;
    });
    
    // Debug-Ausgabe für Datumsformate
    if (events.length > 0) {
      console.log("Beispiel-Termin:", {
        id: events[0].id,
        title: events[0].title,
        date: events[0].date,
        dateType: typeof events[0].date,
        isDateObject: events[0].date instanceof Date
      });
    }
    
    return events;
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
  try {
    if (!event.date) {
      throw new Error('Ungültiges Datum für iCal-Export');
    }
    
    const dateStart = format(event.date, 'yyyyMMdd');
    const timeStart = (event.time || '00:00').replace(':', '') + '00';
    
    // Endzeit ist 2 Stunden nach Startzeit
    let endHours = 0;
    let minutes = 0;
    
    try {
      const [hours, mins] = (event.time || '00:00').split(':').map(Number);
      endHours = hours + 2;
      minutes = mins;
    } catch (error) {
      console.error('Fehler beim Parsen der Zeit:', error);
      endHours = 2;
      minutes = 0;
    }
    
    // Sicherstellen, dass die Stunden nicht über 23 gehen
    if (endHours > 23) {
      endHours = 23;
      minutes = 59;
    }
    
    const timeEnd = `${endHours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
    const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    
    // Escape special characters in text fields
    const escapeText = (text: string) => {
      return (text || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };
    
    const title = escapeText(event.title || 'Unbenannter Termin');
    const location = escapeText(event.location || '');
    const description = escapeText(event.description || '');
    
    return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RWK Einbeck App//DE\nCALSCALE:GREGORIAN\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${dateStart}T${timeStart}\nDTEND:${dateStart}T${timeEnd}\nLOCATION:${location}\nDESCRIPTION:${description}\nSTATUS:CONFIRMED\nSEQUENCE:0\nDTSTAMP:${now}\nCREATED:${now}\nEND:VEVENT\nEND:VCALENDAR`;
  } catch (error) {
    console.error('Fehler beim Generieren des iCal-Events:', error);
    throw error;
  }
}

/**
 * Generiert eine iCal-Datei für mehrere Termine
 * @param events - Liste der Termine
 * @returns iCal-Daten als String
 */
export function generateICalFile(events: Event[]): string {
  try {
    let icalContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RWK Einbeck App//DE\nCALSCALE:GREGORIAN\n`;
    
    // Escape special characters in text fields
    const escapeText = (text: string) => {
      return (text || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };
    
    // Nur gültige Events verarbeiten
    const validEvents = events.filter(event => event && event.date);
    
    for (const event of validEvents) {
      try {
        const dateStart = format(event.date, 'yyyyMMdd');
        const timeStart = (event.time || '00:00').replace(':', '') + '00';
        
        // Endzeit ist 2 Stunden nach Startzeit
        let endHours = 0;
        let minutes = 0;
        
        try {
          const [hours, mins] = (event.time || '00:00').split(':').map(Number);
          endHours = hours + 2;
          minutes = mins;
        } catch (error) {
          console.error('Fehler beim Parsen der Zeit:', error);
          endHours = 2;
          minutes = 0;
        }
        
        // Sicherstellen, dass die Stunden nicht über 23 gehen
        if (endHours > 23) {
          endHours = 23;
          minutes = 59;
        }
        
        const timeEnd = `${endHours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
        const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
        
        const title = escapeText(event.title || 'Unbenannter Termin');
        const location = escapeText(event.location || '');
        const description = escapeText(event.description || '');
        
        icalContent += `BEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${dateStart}T${timeStart}\nDTEND:${dateStart}T${timeEnd}\nLOCATION:${location}\nDESCRIPTION:${description}\nSTATUS:CONFIRMED\nSEQUENCE:0\nDTSTAMP:${now}\nCREATED:${now}\nEND:VEVENT\n`;
      } catch (error) {
        console.error('Fehler beim Verarbeiten eines Events für iCal:', error);
        // Einzelnes Event überspringen, aber weitermachen
        continue;
      }
    }
    
    icalContent += 'END:VCALENDAR';
    
    return icalContent;
  } catch (error) {
    console.error('Fehler beim Generieren der iCal-Datei:', error);
    throw error;
  }
}