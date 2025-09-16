import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Keine Authentifizierung' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    if (decodedToken.email !== 'admin@rwk-einbeck.de') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    console.log('🗑️ Entferne Legacy-Rollen...');
    
    // Alle Benutzer mit clubRoles finden
    const usersSnapshot = await adminDb.collection('user_permissions').get();

    console.log(`📊 Prüfe: ${usersSnapshot.docs.length} Benutzer`);

    const batch = adminDb.batch();
    let cleanedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Nur Legacy-Rollen entfernen, wenn neue Rollen vorhanden sind
      if (userData.clubRoles && Object.keys(userData.clubRoles).length > 0) {
        
        batch.update(userDoc.ref, {
          role: FieldValue.delete(),
          assignedClubId: FieldValue.delete(),
          updatedAt: new Date(),
          legacyRolesRemovedAt: new Date()
        });
        
        cleanedCount++;
        console.log(`🧹 ${userData.email || userDoc.id} → Legacy-Rollen entfernt`);
      }
    }

    await batch.commit();
    
    console.log(`🎉 Bereinigung abgeschlossen! ${cleanedCount} Benutzer bereinigt.`);
    
    return NextResponse.json({
      success: true,
      message: `Legacy-Rollen erfolgreich entfernt! ${cleanedCount} Benutzer bereinigt.`,
      details: {
        totalFound: usersSnapshot.docs.length,
        cleaned: cleanedCount
      }
    });
    
  } catch (error: any) {
    console.error('❌ Bereinigungsfehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Bereinigung fehlgeschlagen'
    }, { status: 500 });
  }
}