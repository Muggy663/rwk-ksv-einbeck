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
      };
    });
  } catch (error) {
    console.error('Fehler beim Laden der Termine:', error);
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
    console.error('Fehler beim Erstellen des Termins:', error);
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
    console.error('Fehler beim Aktualisieren des Termins:', error);
    return false;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'events', id));
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen des Termins:', error);
    return false;
  }
}

export function generateICalEvent(event: Event): string {
  const dateStart = format(event.date, 'yyyyMMdd');
  const timeStart = event.time.replace(':', '') + '00';
  
  // Endzeit ist 2 Stunden nach Startzeit
  const [hours, minutes] = event.time.split(':').map(Number);
  const endHours = hours + 2;
  const timeEnd = `${endHours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
  
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RWK Einbeck App//DE
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${dateStart}T${timeStart}
DTEND:${dateStart}T${timeEnd}
LOCATION:${event.location}
DESCRIPTION:${event.description || ''}
STATUS:CONFIRMED
SEQUENCE:0
DTSTAMP:${now}
CREATED:${now}
END:VEVENT
END:VCALENDAR`;
}

export function generateICalFile(events: Event[]): string {
  let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RWK Einbeck App//DE
CALSCALE:GREGORIAN
`;
  
  events.forEach(event => {
    const dateStart = format(event.date, 'yyyyMMdd');
    const timeStart = event.time.replace(':', '') + '00';
    
    // Endzeit ist 2 Stunden nach Startzeit
    const [hours, minutes] = event.time.split(':').map(Number);
    const endHours = hours + 2;
    const timeEnd = `${endHours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
    
    const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    
    icalContent += `BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${dateStart}T${timeStart}
DTEND:${dateStart}T${timeEnd}
LOCATION:${event.location}
DESCRIPTION:${event.description || ''}
STATUS:CONFIRMED
SEQUENCE:0
DTSTAMP:${now}
CREATED:${now}
END:VEVENT
`;
  });
  
  icalContent += 'END:VCALENDAR';
  
  return icalContent;
}