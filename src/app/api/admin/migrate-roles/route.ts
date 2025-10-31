import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { secureLogger } from '@/lib/utils/secure-logger';

export async function POST(request: NextRequest) {
  try {
    secureLogger.info('Starte Rollen-Migration');
    
    const snapshot = await adminDb.collection('user_permissions').get();
    secureLogger.info('Benutzer gefunden', `Count: ${snapshot.docs.length}`);
    
    const batch = adminDb.batch();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        secureLogger.debug('Prüfe Benutzer', `Role: ${data.role}`);
        
        // Skip nur Super-Admin (bereits korrekt migriert)
        if (data.platformRole === 'SUPER_ADMIN') {
          secureLogger.debug('Skip Super-Admin');
          continue;
        }
        
        const updates: any = {};
        
        // Super-Admin
        if (data.email === 'admin@rwk-einbeck.de') {
          updates.platformRole = 'SUPER_ADMIN';
          secureLogger.info('Super-Admin migration');
        }
        // Vereinsvertreter -> SPORTLEITER (Legacy-Rolle behalten)
        else if (data.role === 'vereinsvertreter' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'SPORTLEITER' };
          // Legacy-Felder BEHALTEN
          if (data.clubId) updates.clubId = data.clubId;
          if (data.assignedClubId) updates.assignedClubId = data.assignedClubId;
          updates.role = 'vereinsvertreter';
          secureLogger.info('Sportleiter migration', `ClubId: ${clubId}`);
        }
        // Vereinsvorstand -> VORSTAND (Legacy-Rolle behalten)
        else if (data.role === 'vereinsvorstand' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'VORSTAND' };
          // Legacy-Felder BEHALTEN
          if (data.clubId) updates.clubId = data.clubId;
          if (data.assignedClubId) updates.assignedClubId = data.assignedClubId;
          updates.role = 'vereinsvorstand';
          secureLogger.info('Vorstand migration', `ClubId: ${clubId}`);
        }
        // Mannschaftsführer -> SPORTLEITER (falls noch nicht migriert)
        else if (data.role === 'mannschaftsfuehrer' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'SPORTLEITER' };
          if (data.clubId) updates.clubId = data.clubId;
          if (data.assignedClubId) updates.assignedClubId = data.assignedClubId;
          updates.role = 'mannschaftsfuehrer';
          secureLogger.info('Mannschaftsführer migration', `ClubId: ${clubId}`);
        }
        // KM-Organisator -> KV-Rolle
        else if (data.role === 'km_organisator') {
          updates.kvRole = 'KV_WETTKAMPFLEITER';
          updates.role = 'km_organisator'; // Legacy behalten
          secureLogger.info('KM-Organisator migration');
        }
        
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = FieldValue.serverTimestamp();
          batch.update(doc.ref, updates);
          count++;
          secureLogger.info('Update vorbereitet');
        } else {
          secureLogger.debug('Keine Updates erforderlich');
        }
      } catch (docError: any) {
        secureLogger.logError(docError, `User migration error for doc: ${doc.id}`);
      }
    }
    
    if (count > 0) {
      secureLogger.info('Committe Updates', `Count: ${count}`);
      await batch.commit();
      secureLogger.info('Migration erfolgreich', `Count: ${count}`);
      return NextResponse.json({
        success: true,
        message: `${count} Benutzer erfolgreich migriert`
      });
    } else {
      secureLogger.info('Keine Migration erforderlich');
      return NextResponse.json({
        success: true,
        message: 'Keine Migration erforderlich'
      });
    }
    
  } catch (error: any) {
    secureLogger.logError(error, 'Migration failed');
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration fehlgeschlagen'
    }, { status: 500 });
  }
}