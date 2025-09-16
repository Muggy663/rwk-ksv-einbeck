// Vollständige Migration aller Vereinsvertreter zu neuen Club-Rollen
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin initialisieren
if (!require('firebase-admin').apps.length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'rwk-einbeck'
  });
}

const db = getFirestore();

async function migrateAllVereinsvertreter() {
  try {
    console.log('🔄 Starte Migration aller Vereinsvertreter...');
    
    // Alle Benutzer mit vereinsvertreter Rolle finden
    const usersSnapshot = await db.collection('user_permissions')
      .where('role', '==', 'vereinsvertreter')
      .get();

    console.log(`📊 Gefunden: ${usersSnapshot.docs.length} Vereinsvertreter`);

    const batch = db.batch();
    let migratedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const clubId = userData.clubId || userData.assignedClubId;
      
      if (!clubId) {
        console.warn(`⚠️ Kein clubId für Benutzer ${userData.email || userDoc.id}`);
        continue;
      }

      // Migration zu neuer Struktur
      const updateData = {
        // Neue Club-Rolle hinzufügen
        clubRoles: {
          [clubId]: 'SPORTLEITER'
        },
        // Legacy-Rolle beibehalten für Übergangszeit
        role: 'vereinsvertreter',
        updatedAt: new Date(),
        migratedAt: new Date(),
        migrationVersion: '1.5.9'
      };

      batch.update(userDoc.ref, updateData);
      migratedCount++;
      
      console.log(`✅ ${userData.email || userDoc.id} → SPORTLEITER für Club ${clubId}`);
    }

    // Alle Vereinsvorstände auch migrieren
    const vorstandSnapshot = await db.collection('user_permissions')
      .where('role', '==', 'vereinsvorstand')
      .get();

    console.log(`📊 Gefunden: ${vorstandSnapshot.docs.length} Vereinsvorstände`);

    for (const userDoc of vorstandSnapshot.docs) {
      const userData = userDoc.data();
      const clubId = userData.clubId || userData.assignedClubId;
      
      if (!clubId) {
        console.warn(`⚠️ Kein clubId für Vorstand ${userData.email || userDoc.id}`);
        continue;
      }

      const updateData = {
        clubRoles: {
          [clubId]: 'VORSTAND'
        },
        role: 'vereinsvorstand',
        updatedAt: new Date(),
        migratedAt: new Date(),
        migrationVersion: '1.5.9'
      };

      batch.update(userDoc.ref, updateData);
      migratedCount++;
      
      console.log(`✅ ${userData.email || userDoc.id} → VORSTAND für Club ${clubId}`);
    }

    // Batch ausführen
    await batch.commit();
    
    console.log(`🎉 Migration abgeschlossen! ${migratedCount} Benutzer migriert.`);
    
  } catch (error) {
    console.error('❌ Migrations-Fehler:', error);
  }
}

migrateAllVereinsvertreter();