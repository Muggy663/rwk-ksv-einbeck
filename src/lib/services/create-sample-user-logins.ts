import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * Erstellt Beispiel-Login-Daten für Benutzer
 */
export async function createSampleUserLogins() {
  try {
    // Benutzerberechtigungen laden
    const usersQuery = collection(db, 'user_permissions');
    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    // Für jeden Benutzer einen Eintrag in der users-Collection erstellen
    for (const user of users) {
      // Zufälliges Datum in den letzten 30 Tagen
      const daysAgo = Math.floor(Math.random() * 30);
      const lastLogin = new Date();
      lastLogin.setDate(lastLogin.getDate() - daysAgo);
      
      // Eintrag in der users-Collection erstellen oder aktualisieren
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: Timestamp.fromDate(lastLogin),
        email: user.email,
        displayName: user.displayName
      }, { merge: true });
    }
    
    console.log(`Login-Daten für ${users.length} Benutzer erstellt`);
    return users.length;
  } catch (error) {
    console.error('Fehler beim Erstellen der Login-Daten:', error);
    throw error;
  }
}