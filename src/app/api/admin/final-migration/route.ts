import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starte finale Datenbank-Migration...');
    
    const snapshot = await adminDb.collection('user_permissions').get();
    console.log(`📊 Gefunden: ${snapshot.docs.length} Benutzer`);
    
    const batch = adminDb.batch();
    let migratedCount = 0;
    let skippedCount = 0;
    const migrationLog: string[] = [];
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const email = data.email || doc.id;
        
        // Skip bereits vollständig migrierte Benutzer
        if (data.migrationVersion === '1.5.9' && data.clubRoles && !data.role) {
          console.log(`⏭️ Skip bereits migriert: ${email}`);
          skippedCount++;
          continue;
        }
        
        const updates: any = {
          updatedAt: FieldValue.serverTimestamp(),
          migrationVersion: '1.5.9',
          finalMigrationAt: FieldValue.serverTimestamp()
        };
        
        // Super-Admin
        if (email === 'admin@rwk-einbeck.de') {
          updates.platformRole = 'SUPER_ADMIN';
          migrationLog.push(`👑 Super-Admin: ${email}`);
        }
        
        // Legacy-Rollen zu neuen Club-Rollen
        if (data.role === 'vereinsvertreter' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'SPORTLEITER' };
          updates.representedClubs = [clubId];
          // Legacy-Rolle ENTFERNEN nach Migration
          updates.role = FieldValue.delete();
          migrationLog.push(`🎯 vereinsvertreter → SPORTLEITER: ${email} (${clubId})`);
        }
        
        else if (data.role === 'vereinsvorstand' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'VORSTAND' };
          updates.representedClubs = [clubId];
          // Legacy-Rolle ENTFERNEN nach Migration
          updates.role = FieldValue.delete();
          migrationLog.push(`🏢 vereinsvorstand → VORSTAND: ${email} (${clubId})`);
        }
        
        else if (data.role === 'mannschaftsfuehrer' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'SPORTLEITER' };
          updates.representedClubs = [clubId];
          // Legacy-Rolle ENTFERNEN nach Migration
          updates.role = FieldValue.delete();
          migrationLog.push(`🎯 mannschaftsfuehrer → SPORTLEITER: ${email} (${clubId})`);
        }
        
        else if (data.role === 'km_organisator') {
          updates.kvRole = 'KV_WETTKAMPFLEITER';
          // Legacy-Rolle ENTFERNEN nach Migration
          updates.role = FieldValue.delete();
          migrationLog.push(`🏆 km_organisator → KV_WETTKAMPFLEITER: ${email}`);
        }
        
        else if (data.role === 'vereins_admin' && (data.clubId || data.assignedClubId)) {
          const clubId = data.clubId || data.assignedClubId;
          updates.clubRoles = { [clubId]: 'VORSTAND' };
          updates.representedClubs = [clubId];
          updates.vereinssoftwareLicense = true;
          updates.vereinssoftwareLicenseActivatedAt = FieldValue.serverTimestamp();
          // Legacy-Rolle ENTFERNEN nach Migration
          updates.role = FieldValue.delete();
          migrationLog.push(`💎 vereins_admin → VORSTAND + Lizenz: ${email} (${clubId})`);
        }
        
        // Benutzer ohne erkannte Rolle
        else if (data.role && !['superadmin'].includes(data.role)) {
          migrationLog.push(`❓ Unbekannte Rolle: ${email} (${data.role}) - manuell prüfen`);
          continue;
        }
        
        if (Object.keys(updates).length > 3) { // Mehr als nur Timestamps
          batch.update(doc.ref, updates);
          migratedCount++;
          console.log(`✅ Migration vorbereitet für: ${email}`);
        } else {
          skippedCount++;
        }
        
      } catch (docError: any) {
        console.error(`❌ Fehler bei Benutzer ${doc.id}:`, docError);
        migrationLog.push(`❌ Fehler: ${doc.id} - ${docError.message}`);
      }
    }
    
    if (migratedCount > 0) {
      console.log(`💾 Committe ${migratedCount} finale Migrationen...`);
      await batch.commit();
      console.log(`✅ ${migratedCount} Benutzer final migriert, ${skippedCount} übersprungen`);
      
      return NextResponse.json({
        success: true,
        message: `Finale Migration abgeschlossen: ${migratedCount} migriert, ${skippedCount} übersprungen`,
        migrationLog,
        stats: {
          total: snapshot.docs.length,
          migrated: migratedCount,
          skipped: skippedCount
        }
      });
    } else {
      console.log(`ℹ️ Keine finale Migration erforderlich`);
      return NextResponse.json({
        success: true,
        message: 'Alle Benutzer bereits final migriert',
        migrationLog,
        stats: {
          total: snapshot.docs.length,
          migrated: 0,
          skipped: skippedCount
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ Finale Migration-Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Finale Migration fehlgeschlagen'
    }, { status: 500 });
  }
}
