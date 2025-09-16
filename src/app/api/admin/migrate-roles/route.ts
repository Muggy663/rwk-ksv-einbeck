import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starte Rollen-Migration...');
    
    const snapshot = await adminDb.collection('user_permissions').get();
    console.log(`📊 Gefunden: ${snapshot.docs.length} Benutzer`);
    
    const batch = adminDb.batch();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        console.log(`🔍 Prüfe Benutzer: ${data.email} (${data.role})`);
        
        // Skip nur Super-Admin (bereits korrekt migriert)
        if (data.platformRole === 'SUPER_ADMIN') {
          console.log(`⏭️ Skip Super-Admin: ${data.email}`);
          continue;
        }
        
        const updates: any = {};
        
        // Super-Admin
        if (data.email === 'admin@rwk-einbeck.de') {
          updates.platformRole = 'SUPER_ADMIN';
          console.log(`👑 Super-Admin: ${data.email}`);
        }
        // Vereinsvertreter -> SPORTLEITER (Legacy-Rolle behalten)
        else if (data.role === 'vereinsvertreter' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'SPORTLEITER' };
          // Legacy-Felder BEHALTEN
          if (data.clubId) updates.clubId = data.clubId;
          if (data.assignedClubId) updates.assignedClubId = data.assignedClubId;
          updates.role = 'vereinsvertreter';
          console.log(`🎯 Sportleiter: ${data.email} (${clubId})`);
        }
        // Vereinsvorstand -> VORSTAND (Legacy-Rolle behalten)
        else if (data.role === 'vereinsvorstand' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'VORSTAND' };
          // Legacy-Felder BEHALTEN
          if (data.clubId) updates.clubId = data.clubId;
          if (data.assignedClubId) updates.assignedClubId = data.assignedClubId;
          updates.role = 'vereinsvorstand';
          console.log(`🏢 Vorstand: ${data.email} (${clubId})`);
        }
        // Mannschaftsführer -> SPORTLEITER (falls noch nicht migriert)
        else if (data.role === 'mannschaftsfuehrer' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'SPORTLEITER' };
          if (data.clubId) updates.clubId = data.clubId;
          if (data.assignedClubId) updates.assignedClubId = data.assignedClubId;
          updates.role = 'mannschaftsfuehrer';
          console.log(`🎯 Mannschaftsführer->Sportleiter: ${data.email} (${clubId})`);
        }
        // KM-Organisator -> KV-Rolle
        else if (data.role === 'km_organisator') {
          updates.kvRole = 'KV_WETTKAMPFLEITER';
          updates.role = 'km_organisator'; // Legacy behalten
          console.log(`🏆 KM-Organisator: ${data.email}`);
        }
        
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = FieldValue.serverTimestamp();
          batch.update(doc.ref, updates);
          count++;
          console.log(`✅ Update vorbereitet für: ${data.email}`);
        } else {
          console.log(`⏭️ Keine Updates für: ${data.email}`);
        }
      } catch (docError: any) {
        console.error(`❌ Fehler bei Benutzer ${doc.id}:`, docError);
      }
    }
    
    if (count > 0) {
      console.log(`💾 Committe ${count} Updates...`);
      await batch.commit();
      console.log(`✅ ${count} Benutzer erfolgreich migriert`);
      return NextResponse.json({
        success: true,
        message: `${count} Benutzer erfolgreich migriert`
      });
    } else {
      console.log(`ℹ️ Keine Migration erforderlich`);
      return NextResponse.json({
        success: true,
        message: 'Keine Migration erforderlich'
      });
    }
    
  } catch (error: any) {
    console.error('❌ Migration-Fehler:', error);
    console.error('❌ Stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration fehlgeschlagen'
    }, { status: 500 });
  }
}