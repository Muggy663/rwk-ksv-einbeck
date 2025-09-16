const admin = require('firebase-admin');

// Firebase Admin initialisieren
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'ksv-einbeck-app'
  });
}

const db = admin.firestore();

async function fixStephanieRole() {
  try {
    // Stephanie's UID aus der Konsole
    const stephanieUid = '9Hq5Jjcf1YPjIXUV1eXXoTS1s8D3';
    
    await db.collection('user_permissions').doc(stephanieUid).update({
      kvRoles: {
        'einbeck': 'KV_WETTKAMPFLEITER'
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'admin-script'
    });
    
    console.log('✅ Stephanie ist jetzt KV-Wettkampfleiter');
    
    // Alle Sportleiter finden und KM-Zugang geben
    const usersSnapshot = await db.collection('user_permissions').get();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      // Prüfe ob Sportleiter in clubRoles
      if (userData.clubRoles) {
        const isSportleiter = Object.values(userData.clubRoles).includes('SPORTLEITER');
        
        if (isSportleiter && (!userData.representedClubs || userData.representedClubs.length === 0)) {
          // Alle Vereine als representedClubs setzen (für KM-Zugang)
          const clubsSnapshot = await db.collection('clubs').get();
          const allClubIds = clubsSnapshot.docs.map(doc => doc.id);
          
          await db.collection('user_permissions').doc(doc.id).update({
            representedClubs: allClubIds,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'admin-script-sportleiter-km-access'
          });
          
          console.log(`✅ ${userData.email} (Sportleiter) hat jetzt KM-Zugang`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

fixStephanieRole();