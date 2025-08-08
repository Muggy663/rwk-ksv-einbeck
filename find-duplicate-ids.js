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

async function findDuplicateIds() {
  console.log('🔍 Suche doppelte Schützen-IDs...');
  
  // Suche nach Jürgen Wauker
  const scoresSnapshot = await db.collection('rwk_scores')
    .where('shooterName', '==', 'Jürgen Wauker')
    .where('teamName', '==', 'SV Lauenberg I')
    .get();
  
  const scoresByShooterId = new Map();
  scoresSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (!scoresByShooterId.has(data.shooterId)) {
      scoresByShooterId.set(data.shooterId, []);
    }
    scoresByShooterId.get(data.shooterId).push({
      scoreId: doc.id,
      durchgang: data.durchgang,
      totalRinge: data.totalRinge
    });
  });
  
  console.log(`\n📊 Jürgen Wauker hat ${scoresByShooterId.size} verschiedene Schützen-IDs:`);
  
  for (const [shooterId, scores] of scoresByShooterId) {
    console.log(`\n🎯 Schützen-ID: ${shooterId}`);
    console.log(`   Anzahl Scores: ${scores.length}`);
    scores.forEach(score => {
      console.log(`   - DG${score.durchgang}: ${score.totalRinge} Ringe (Score-ID: ${score.scoreId})`);
    });
  }
  
  // Empfehlung
  let bestId = null;
  let maxScores = 0;
  for (const [shooterId, scores] of scoresByShooterId) {
    if (scores.length > maxScores) {
      maxScores = scores.length;
      bestId = shooterId;
    }
  }
  
  console.log(`\n💡 EMPFEHLUNG:`);
  console.log(`   ✅ BEHALTEN: ${bestId} (${maxScores} Scores)`);
  
  for (const [shooterId, scores] of scoresByShooterId) {
    if (shooterId !== bestId) {
      console.log(`   🗑️ LÖSCHEN: ${shooterId} (${scores.length} Scores)`);
      console.log(`      - Lösche Schütze aus rwk_shooters: ${shooterId}`);
      scores.forEach(score => {
        console.log(`      - Lösche Score aus rwk_scores: ${score.scoreId}`);
      });
    }
  }
}

findDuplicateIds().then(() => process.exit(0));