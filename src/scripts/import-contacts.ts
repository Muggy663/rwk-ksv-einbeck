// Import Script für E-Mail-Verteiler
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const emailList = `
Adrian Schomburg <schomburgadrian@gmail.com>; Andreas Coors (a-coors@t-online.de); Angelika Kappei <kjl-a.kappei@web.de>; anna-lena.mundhenk@web.de; astitz@t-online.de; danielamaier72@web.de; elk.fritsch@gmx.de; erhard-helmker@t-online.de; Felted1@web.de; frankkappey@gmx.de; gabriel.einbeck@t-online.de; grote.hsc@online.de; henrikehoffmann@hotmail.de; hhn.hoffmann@online.de; hoffmann-mackensen@t-online.de; Horst-Ebers-jun@gmx.de; hturdreyer@web.de; inge-oppermann@t-online.de; Jan Greve <jangreve1@web.de>; JJIKahle@web.de; johanna84@gmx.net; Jürgen Wauker <juergen.wauker@gmx.de>; k.czaika@t-online.de; karsten.reinert@gmx.de; katrinklose@googlemail.com; kerstin.collin@gmx.net; kerstin.hundertmark@gmx.de; kodaller@gmail.com; ksve@baselt.de; maisold.r@gmail.com; marcel.buenger@gmx.de; mein-janosch@t-online.de; michael.fillips@freenet.de; michael.lex@ludwig-und-partner.de; michael.stuke@gmx.net; michel.knoke@freenet.de; mirko-kappei@web.de; mr-pfeifferlbg@t-online.de; mw290650@aol.com; oliver.jeske@gmx.de; olschewski.einbeck@freenet.de; pulli1@t-online.de; Rebecca.mue66@yahoo.de; a.bokelmann@live.de; reineke.fabian@web.de; sander-lars@t-online.de; sandralosche39@gmail.com; schrader-sigrid@t-online.de; schroeder81@web.de; Silke.duee@freenet.de; sophie.traupe@web.de; Stephanie.Buenger@gmx.de; tabeastitz@t-online.de; W.Halm@web.de; wikalichte@t-online.de
`;

interface Contact {
  name: string;
  email: string;
  group: string;
  role: string;
  createdAt: Date;
}

function parseEmailList(emailString: string): Contact[] {
  const contacts: Contact[] = [];
  
  // Split by semicolon
  const entries = emailString.split(';').map(entry => entry.trim()).filter(entry => entry.length > 0);
  
  entries.forEach(entry => {
    let name = '';
    let email = '';
    
    // Pattern: "Name <email>" or "Name (email)" or just "email"
    const angleMatch = entry.match(/^(.+?)\s*<(.+?)>$/);
    const parenMatch = entry.match(/^(.+?)\s*\((.+?)\)$/);
    const emailMatch = entry.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    
    if (angleMatch) {
      name = angleMatch[1].trim();
      email = angleMatch[2].trim();
    } else if (parenMatch) {
      name = parenMatch[1].trim();
      email = parenMatch[2].trim();
    } else if (emailMatch) {
      email = entry.trim();
      name = email.split('@')[0]; // Use part before @ as name
    } else {
      console.warn('Could not parse:', entry);
      return;
    }
    
    if (email && email.includes('@')) {
      contacts.push({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        group: 'sportleiter',
        role: 'vereinsvertreter',
        createdAt: new Date()
      });
    }
  });
  
  return contacts;
}

export async function importContacts() {
  console.log('🔄 Importiere E-Mail-Kontakte...');
  
  const contacts = parseEmailList(emailList);
  console.log(`📧 ${contacts.length} Kontakte gefunden`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const contact of contacts) {
    try {
      // Check if email already exists
      const existingQuery = query(
        collection(db, 'email_contacts'),
        where('email', '==', contact.email)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (existingDocs.empty) {
        await addDoc(collection(db, 'email_contacts'), contact);
        console.log(`✅ Importiert: ${contact.name} (${contact.email})`);
        imported++;
      } else {
        console.log(`⏭️ Übersprungen (existiert): ${contact.email}`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Fehler bei ${contact.email}:`, error);
    }
  }
  
  console.log(`\n📊 Import abgeschlossen:`);
  console.log(`✅ Importiert: ${imported}`);
  console.log(`⏭️ Übersprungen: ${skipped}`);
  console.log(`📧 Gesamt: ${contacts.length}`);
}

// Für direkten Aufruf
if (typeof window !== 'undefined') {
  (window as any).importContacts = importContacts;
}