import { db } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/secure-logger';
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

export async function fetchEvents(
  startDate?: Date,
  endDate?: Date,
  leagueId?: string
): Promise<Event[]> {
  try {
    const eventsRef = collection(db, 'events');
    const constraints: any[] = [];

    if (leagueId && leagueId !== 'all') {
      constraints.push(where('leagueId', '==', leagueId));
    }

    constraints.push(orderBy('date', 'asc'));

    const eventsQuery = query(eventsRef, ...constraints);
    const snapshot = await getDocs(eventsQuery);

    const events = snapshot.docs.map(doc => {
      const data = doc.data();

      let eventDate: Date;
      try {
        if (data.date?.toDate) {
          eventDate = data.date.toDate();
        } else if (typeof data.date === 'string') {
          eventDate = new Date(data.date);
        } else {
          eventDate = new Date();
        }
      } catch (error) {
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

    // Client-seitiger Filter - funktioniert auch bei String-Daten
    return events.filter(event => {
      if (startDate && event.date < startDate) return false;
      if (endDate && event.date > endDate) return false;
      return true;
    });

  } catch (error) {
    logError('Fehler beim Laden der Termine:', error);
    return [];
  }
}

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
    logError('Fehler beim Erstellen des Termins:', error);
    return null;
  }
}

export async function updateEvent(id: string, event: Partial<Event>): Promise<boolean> {
  try {
    const eventData: any = { ...event };

    if (event.date) {
      eventData.date = Timestamp.fromDate(event.date);
    }

    await updateDoc(doc(db, 'events', id), eventData);
    return true;
  } catch (error) {
    logError('Fehler beim Aktualisieren des Termins:', error);
    return false;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'events', id));
    return true;
  } catch (error) {
    logError('Fehler beim Löschen des Termins:', error);
    return false;
  }
}

// iCal-Textfelder escapen (Backslash, Semikolon, Komma, Zeilenumbruch).
function escapeICalText(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// Baut EINEN VEVENT-Block. Start = event.time, Ende = Start + 2 Stunden.
// Der Übertrag über Mitternacht wird über ein echtes Date sauber berechnet
// (früher wurde fälschlich auf 23:59 gekappt, sodass z.B. 22:30 → 23:59 wurde,
// statt korrekt auf den Folgetag zu übertragen).
function buildVEvent(event: Event): string {
  const [h, m] = (event.time || '00:00').split(':').map((n) => {
    const parsed = Number(n);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const startLocal = new Date(event.date);
  startLocal.setHours(h, m, 0, 0);
  const endLocal = new Date(startLocal.getTime() + 2 * 60 * 60 * 1000);

  // Floating local time (ohne Z / TZID) – wird vom Kalender als lokale Zeit gelesen.
  const dtStart = format(startLocal, "yyyyMMdd'T'HHmmss");
  const dtEnd = format(endLocal, "yyyyMMdd'T'HHmmss");
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

  const title = escapeICalText(event.title || 'Unbenannter Termin');
  const location = escapeICalText(event.location || '');
  const description = escapeICalText(event.description || '');

  return `BEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nLOCATION:${location}\nDESCRIPTION:${description}\nSTATUS:CONFIRMED\nSEQUENCE:0\nDTSTAMP:${now}\nCREATED:${now}\nEND:VEVENT`;
}

export function generateICalEvent(event: Event): string {
  try {
    if (!event.date) {
      throw new Error('Ungültiges Datum für iCal-Export');
    }
    return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RWK Einbeck App//DE\nCALSCALE:GREGORIAN\n${buildVEvent(event)}\nEND:VCALENDAR`;
  } catch (error) {
    logError('Fehler beim Generieren des iCal-Events:', error);
    throw error;
  }
}

export function generateICalFile(events: Event[]): string {
  try {
    let icalContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RWK Einbeck App//DE\nCALSCALE:GREGORIAN\n`;

    const validEvents = events.filter(event => event && event.date);

    for (const event of validEvents) {
      try {
        icalContent += buildVEvent(event) + '\n';
      } catch (error) {
        logError('Fehler beim Verarbeiten eines Events für iCal:', error);
        continue;
      }
    }

    icalContent += 'END:VCALENDAR';
    return icalContent;
  } catch (error) {
    logError('Fehler beim Generieren der iCal-Datei:', error);
    throw error;
  }
}

// Erzeugt eine „Zu Google Kalender hinzufügen"-URL. Öffnet den Termin
// vorausgefüllt im Browser/der Google-App – ein Klick, der Nutzer muss nur
// noch speichern. Start = event.time, Ende = Start + 2 Stunden.
export function generateGoogleCalendarUrl(event: Event): string {
  const [h, m] = (event.time || '00:00').split(':').map((n) => {
    const parsed = Number(n);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const start = new Date(event.date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  // Google erwartet lokale Zeit im Format yyyyMMddTHHmmss (ohne Z).
  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Termin',
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
