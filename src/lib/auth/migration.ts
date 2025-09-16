// src/lib/auth/migration.ts
// Migration von Legacy-Rollen zu neuer 3-Ebenen-Architektur

import { adminDb } from '@/lib/firebase/admin';
import type { UserPermissions, ClubRole } from './roles';

export async function migrateLegacyRoles() {
  console.log('🔄 Starte Rollen-Migration...');
  
  try {
    const userPermissionsSnapshot = await adminDb.collection('user_permissions').get();
    const batch = adminDb.batch();
    let migratedCount = 0;
    
    for (const doc of userPermissionsSnapshot.docs) {
      const data = doc.data() as UserPermissions;
      
      // Skip bereits migrierte Benutzer
      if (data.clubRoles || data.platformRole) {
        console.log(`⏭️  Überspringe bereits migrierten Benutzer: ${data.email}`);
        continue;
      }
      
      const updates: Partial<UserPermissions> = {};
      
      // Super-Admin
      if (data.email === 'admin@rwk-einbeck.de') {
        updates.platformRole = 'SUPER_ADMIN';
        console.log(`👑 Super-Admin migriert: ${data.email}`);
      }
      
      // Legacy vereinsvertreter -> SPORTLEITER
      else if (data.role === 'vereinsvertreter' && (data.clubId || data.assignedClubId)) {
        const clubId = data.clubId || data.assignedClubId!;
        updates.clubRoles = { [clubId]: 'SPORTLEITER' as ClubRole };
        console.log(`🎯 Vereinsvertreter -> Sportleiter: ${data.email} (${clubId})`);
      }
      
      // Legacy vereinsvorstand -> VORSTAND
      else if (data.role === 'vereinsvorstand' && (data.clubId || data.assignedClubId)) {
        const clubId = data.clubId || data.assignedClubId!;
        updates.clubRoles = { [clubId]: 'VORSTAND' as ClubRole };
        console.log(`🏢 Vereinsvorstand -> Vorstand: ${data.email} (${clubId})`);
      }
      
      // Legacy km_orga -> KV_KM_ORGA (später implementieren)
      else if (data.role === 'km_orga') {
        // TODO: KV-Zuordnung implementieren
        console.log(`⏳ KM-Orga noch nicht migriert: ${data.email}`);
        continue;
      }
      
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        batch.update(doc.ref, updates);
        migratedCount++;
      }
    }
    
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`✅ ${migratedCount} Benutzer erfolgreich migriert`);
    } else {
      console.log('ℹ️  Keine Migration erforderlich');
    }
    
  } catch (error) {
    console.error('❌ Fehler bei Rollen-Migration:', error);
    throw error;
  }
}

// Rollback-Funktion für Notfälle
export async function rollbackRoleMigration() {
  console.log('🔄 Starte Rollen-Rollback...');
  
  try {
    const userPermissionsSnapshot = await adminDb.collection('user_permissions').get();
    const batch = adminDb.batch();
    let rollbackCount = 0;
    
    for (const doc of userPermissionsSnapshot.docs) {
      const data = doc.data() as UserPermissions;
      
      // Nur migrierte Benutzer zurücksetzen
      if (!data.clubRoles && !data.platformRole) continue;
      
      const updates: any = {
        platformRole: null,
        kvRoles: null,
        clubRoles: null,
        updatedAt: new Date()
      };
      
      batch.update(doc.ref, updates);
      rollbackCount++;
    }
    
    if (rollbackCount > 0) {
      await batch.commit();
      console.log(`🔙 ${rollbackCount} Benutzer zurückgesetzt`);
    }
    
  } catch (error) {
    console.error('❌ Fehler bei Rollback:', error);
    throw error;
  }
}