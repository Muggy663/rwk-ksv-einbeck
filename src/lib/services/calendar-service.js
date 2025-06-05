import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

/**
 * @typedef {Object} Event
 * @property {string} [id]
 * @property {string} title
 * @property {Date} date
 * @property {string} time
 * @property {string} location
 * @property {string} leagueId
 * @property {string} leagueName
 * @property {'durchgang' | 'kreismeisterschaft' | 'sitzung' | 'sonstiges'} type
 * @property {string} [description]
 * @property {boolean} isKreisverband
 * @property {string} createdBy
 * @property {Date} createdAt
 */

/**
 * Lädt Termine aus der Datenbank
 * @param {Date} [startDate] - Startdatum für die Filterung
 * @param {Date} [endDate] - Enddatum für die Filterung
 * @param {string} [leagueId] - Liga-ID für die Filterung
 * @returns {Promise<Event[]>} Liste der Termine
 */
export async function fetchEvents(
  startDate,
  endDate,
  leagueId
) {
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
      };
    });
  } catch (error) {
    console.error('Fehler beim Laden der Termine:', error);
    return [];
  }
}

/**
 * Erstellt einen neuen Termin
 * @param {Omit<Event, 'id' | 'createdAt'>} event - Termindaten
 * @returns {Promise<string|null>} ID des erstellten Termins oder null bei Fehler
 */
export async function createEvent(event) {
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
 * @param {string} id - ID des Termins
 * @param {Partial<Event>} event - Zu aktualisierende Termindaten
 * @returns {Promise<boolean>} Erfolg der Aktualisierung
 */
export async function updateEvent(id, event) {
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
 * @param {string} id - ID des Termins
 * @returns {Promise<boolean>} Erfolg des Löschvorgangs
 */
export async function deleteEvent(id) {
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
 * @param {Event} event - Termindaten
 * @returns {string} iCal-Daten als String
 */
export function generateICalEvent(event) {
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
 * @param {Event[]} events - Liste der Termine
 * @returns {string} iCal-Daten als String
 */
export function generateICalFile(events) {
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