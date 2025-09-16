// Migrations-Script für marcel.buenger@gmx.de
// Von vereinsvertreter zu SPORTLEITER

const admin = require('firebase-admin');

// Firebase Admin initialisieren
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'rwk-einbeck'
  });
}

const db = admin.firestore();

async function migrateUser() {
  try {
    // Finde Benutzer anhand E-Mail
    const usersSnapshot = await db.collection('user_permissions')
      .where('email', '==', 'marcel.buenger@gmx.de')
      .get();

    if (usersSnapshot.empty) {
      console.log('Benutzer nicht gefunden');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('Aktuelle Daten:', userData);

    // Migration zu neuer Struktur
    const newData = {
      ...userData,
      // Neue Club-Rolle
      clubRoles: {
        [userData.clubId || userData.assignedClubId]: 'SPORTLEITER'
      },
      // Legacy-Rolle beibehalten für Übergangszeit
      role: 'vereinsvertreter',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userDoc.ref.update(newData);
    console.log('✅ Migration erfolgreich!');
    console.log('Neue Daten:', newData);

  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

migrateUser();