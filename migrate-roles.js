// migrate-roles.js - Rollen-Migration Script
// Führe aus: node migrate-roles.js

require('dotenv').config();
const admin = require('firebase-admin');

// Service Account initialisieren
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

console.log('🔧 Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('🔧 Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('🔧 Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function migrateRoles() {
  console.log('🔄 Starte Rollen-Migration...');
  
  try {
    const snapshot = await db.collection('user_permissions').get();
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip bereits migrierte
      if (data.clubRoles || data.platformRole) return;
      
      const updates = {};
      
      // Super-Admin
      if (data.email === 'admin@rwk-einbeck.de') {
        updates.platformRole = 'SUPER_ADMIN';
        console.log(`👑 Super-Admin: ${data.email}`);
      }
      // Vereinsvertreter -> SPORTLEITER
      else if (data.role === 'vereinsvertreter' && (data.clubId || data.assignedClubId)) {
        const clubId = data.clubId || data.assignedClubId;
        updates.clubRoles = { [clubId]: 'SPORTLEITER' };
        console.log(`🎯 Sportleiter: ${data.email} (${clubId})`);
      }
      // Vereinsvorstand -> VORSTAND
      else if (data.role === 'vereinsvorstand' && (data.clubId || data.assignedClubId)) {
        const clubId = data.clubId || data.assignedClubId;
        updates.clubRoles = { [clubId]: 'VORSTAND' };
        console.log(`🏢 Vorstand: ${data.email} (${clubId})`);
      }
      
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        batch.update(doc.ref, updates);
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`✅ ${count} Benutzer migriert`);
    } else {
      console.log('ℹ️ Keine Migration nötig');
    }
    
  } catch (error) {
    console.error('❌ Migration-Fehler:', error);
  }
}

migrateRoles().then(() => process.exit(0));