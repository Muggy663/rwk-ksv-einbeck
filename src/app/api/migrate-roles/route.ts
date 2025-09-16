import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung prüfen
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Keine Authentifizierung' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Nur Superadmin darf migrieren
    if (decodedToken.email !== 'admin@rwk-einbeck.de') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    console.log('🔄 Starte Migration aller Vereinsvertreter...');
    
    // Alle Vereinsvertreter finden
    const usersSnapshot = await adminDb.collection('user_permissions')
      .where('role', '==', 'vereinsvertreter')
      .get();

    console.log(`📊 Gefunden: ${usersSnapshot.docs.length} Vereinsvertreter`);

    const batch = adminDb.batch();
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
        clubRoles: {
          [clubId]: 'SPORTLEITER'
        },
        role: 'vereinsvertreter', // Legacy beibehalten
        updatedAt: new Date(),
        migratedAt: new Date(),
        migrationVersion: '1.5.9'
      };

      batch.update(userDoc.ref, updateData);
      migratedCount++;
      
      console.log(`✅ ${userData.email || userDoc.id} → SPORTLEITER für Club ${clubId}`);
    }

    // Vereinsvorstände auch migrieren
    const vorstandSnapshot = await adminDb.collection('user_permissions')
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
        role: 'vereinsvorstand', // Legacy beibehalten
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
    
    return NextResponse.json({
      success: true,
      message: `Migration erfolgreich! ${migratedCount} Benutzer migriert.`,
      details: {
        vereinsvertreter: usersSnapshot.docs.length,
        vereinsvorstände: vorstandSnapshot.docs.length,
        totalMigrated: migratedCount
      }
    });
    
  } catch (error: any) {
    console.error('❌ Migrations-Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration fehlgeschlagen'
    }, { status: 500 });
  }
}