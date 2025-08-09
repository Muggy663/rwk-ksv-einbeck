// Migration Script: Kopiere fehlende Schützen von km_shooters zu rwk_shooters
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where } = require('firebase/firestore');

// Firebase Config hier einfügen
const firebaseConfig = {
  // Deine Firebase Config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateMissingShooters() {
  try {
    console.log('🔍 Suche nach Teams mit fehlenden Schützen...');
    
    // Lade alle Teams
    const teamsSnapshot = await getDocs(collection(db, 'rwk_teams'));
    const teams = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const missingShooterIds = new Set();
    
    // Finde fehlende Schützen-IDs
    for (const team of teams) {
      if (team.shooterIds) {
        for (const shooterId of team.shooterIds) {
          // Prüfe ob in rwk_shooters vorhanden
          const rwkShooter = await getDoc(doc(db, 'rwk_shooters', shooterId));
          if (!rwkShooter.exists()) {
            missingShooterIds.add(shooterId);
          }
        }
      }
    }
    
    console.log(`📊 ${missingShooterIds.size} fehlende Schützen-IDs gefunden`);
    
    // Kopiere fehlende Schützen von km_shooters zu rwk_shooters
    let migratedCount = 0;
    for (const shooterId of missingShooterIds) {
      try {
        const kmShooter = await getDoc(doc(db, 'km_shooters', shooterId));
        if (kmShooter.exists()) {
          const shooterData = kmShooter.data();
          
          // Kopiere zu rwk_shooters mit angepassten Feldern
          await setDoc(doc(db, 'rwk_shooters', shooterId), {
            ...shooterData,
            // Stelle sicher dass rwkClubId gesetzt ist
            rwkClubId: shooterData.clubId || shooterData.rwkClubId || shooterData.kmClubId,
            migratedFrom: 'km_shooters',
            migratedAt: new Date()
          });
          
          migratedCount++;
          console.log(`✅ Schütze ${shooterData.name} migriert`);
        } else {
          console.log(`❌ Schütze ${shooterId} auch nicht in km_shooters gefunden`);
        }
      } catch (error) {
        console.error(`❌ Fehler bei Migration von ${shooterId}:`, error);
      }
    }
    
    console.log(`🎉 Migration abgeschlossen: ${migratedCount} Schützen migriert`);
    
  } catch (error) {
    console.error('❌ Migration Fehler:', error);
  }
}

migrateMissingShooters();