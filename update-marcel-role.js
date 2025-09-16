// Schnelle Rollen-Migration für marcel.buenger@gmx.de
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin initialisieren
if (!require('firebase-admin').apps.length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'rwk-einbeck'
  });
}

const db = getFirestore();

async function updateMarcelRole() {
  try {
    const userRef = db.collection('user_permissions').doc('m7ffEKT1qXebEDKYaa2ohLQUO4p2');
    
    await userRef.update({
      // Neue Club-Rolle hinzufügen
      clubRoles: {
        '1icqJ91FFStTBn6ORukx': 'SPORTLEITER'
      },
      // Legacy-Rolle beibehalten
      role: 'vereinsvertreter',
      updatedAt: new Date()
    });

    console.log('✅ Marcel wurde zu SPORTLEITER migriert!');
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

updateMarcelRole();