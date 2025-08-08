const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function mergeShooterIds() {
  console.log('🔧 Merge Schützen-IDs...');
  
  // Bekannte Duplikate
  const duplicates = [
    { name: 'Jürgen Wauker', team: 'SV Lauenberg I' }
  ];
  
  for (const duplicate of duplicates) {
    console.log(`\n📝 Bearbeite: ${duplicate.name}`);
    
    // Finde alle Scores für diesen Schützen
    const scoresSnapshot = await db.collection('rwk_scores')
      .where('shooterName', '==', duplicate.name)
      .where('teamName', '==', duplicate.team)
      .get();
    
    const scoresByShooterId = new Map();
    scoresSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!scoresByShooterId.has(data.shooterId)) {
        scoresByShooterId.set(data.shooterId, []);
      }
      scoresByShooterId.get(data.shooterId).push({ id: doc.id, ...data });
    });
    
    if (scoresByShooterId.size <= 1) {
      console.log('⚠️ Keine verschiedenen Schützen-IDs gefunden');
      continue;
    }
    
    console.log(`📊 Gefunden: ${scoresByShooterId.size} verschiedene Schützen-IDs`);
    
    // Finde die beste Schützen-ID (mit den meisten Scores)
    let bestShooterId = null;
    let maxScores = 0;
    
    for (const [shooterId, scores] of scoresByShooterId) {
      console.log(`  - ${shooterId}: ${scores.length} Scores`);
      if (scores.length > maxScores) {
        maxScores = scores.length;
        bestShooterId = shooterId;
      }
    }
    
    console.log(`✅ Behalte Schützen-ID: ${bestShooterId}`);
    
    // Merge alle anderen IDs zu der besten
    for (const [shooterId, scores] of scoresByShooterId) {
      if (shooterId !== bestShooterId) {
        console.log(`🔄 Merge ${shooterId} -> ${bestShooterId}`);
        
        for (const score of scores) {
          try {
            await db.collection('rwk_scores').doc(score.id).update({
              shooterId: bestShooterId
            });
            console.log(`  ✅ Score ${score.id} aktualisiert`);
          } catch (error) {
            console.error(`  ❌ Fehler bei ${score.id}:`, error);
          }
        }
        
        // Lösche die alte Schützen-ID
        try {
          await db.collection('rwk_shooters').doc(shooterId).delete();
          console.log(`🗑️ Alte Schützen-ID ${shooterId} gelöscht`);
        } catch (error) {
          console.error(`❌ Fehler beim Löschen ${shooterId}:`, error);
        }
      }
    }
  }
  
  console.log('\n🎉 Merge abgeschlossen!');
}

mergeShooterIds().then(() => process.exit(0));