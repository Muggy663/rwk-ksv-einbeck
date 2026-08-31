// src/lib/auth/migration.ts
// Migration von Legacy-Rollen zu neuer 3-Ebenen-Architektur

import { adminDb } from '@/lib/firebase/admin';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import type { UserPermissions, ClubRole } from './roles';

export async function migrateLegacyRoles() {
  logDebug('🔄 Starte Rollen-Migration...');
  
  try {
    const userPermissionsSnapshot = await adminDb.collection('user_permissions').get();
    const batch = adminDb.batch();
    let migratedCount = 0;
    
    for (const doc of userPermissionsSnapshot.docs) {
      const data = doc.data() as UserPermissions;
      
      // Skip bereits migrierte Benutzer
      if (data.clubRoles || data.platformRole) {
        logDebug(`⏭️  Überspringe bereits migrierten Benutzer: ${data.email}`);
        continue;
      }
      
      const updates: Partial<UserPermissions> = {};
      
      // Super-Admin
      if (data.email === 'admin@rwk-einbeck.de') {
        updates.platformRole = 'SUPER_ADMIN';
        logDebug(`👑 Super-Admin migriert: ${data.email}`);
      }
      
      // Legacy vereinsvertreter -> SPORTLEITER
      else if (data.role === 'vereinsvertreter' && (data.clubId || data.assignedClubId)) {
        const clubId = data.clubId || data.assignedClubId!;
        updates.clubRoles = { [clubId]: 'SPORTLEITER' as ClubRole };
        logDebug(`🎯 Vereinsvertreter -> Sportleiter: ${data.email} (${clubId})`);
      }
      
      // Legacy vereinsvorstand -> VORSTAND
      else if (data.role === 'vereinsvorstand' && (data.clubId || data.assignedClubId)) {
        const clubId = data.clubId || data.assignedClubId!;
        updates.clubRoles = { [clubId]: 'VORSTAND' as ClubRole };
        logDebug(`🏢 Vereinsvorstand -> Vorstand: ${data.email} (${clubId})`);
      }
      
      // Legacy km_orga -> KV_KM_ORGA (später implementieren)
      else if (data.role === 'km_orga') {
        // TODO: KV-Zuordnung implementieren
        logDebug(`⏳ KM-Orga noch nicht migriert: ${data.email}`);
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
      logDebug(`✅ ${migratedCount} Benutzer erfolgreich migriert`);
    } else {
      logDebug('ℹ️  Keine Migration erforderlich');
    }
    
  } catch (error) {
    logError('❌ Fehler bei Rollen-Migration:', error);
    throw error;
  }
}

// Rollback-Funktion für Notfälle
export async function rollbackRoleMigration() {
  logDebug('🔄 Starte Rollen-Rollback...');
  
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
      logDebug(`🔙 ${rollbackCount} Benutzer zurückgesetzt`);
    }
    
  } catch (error) {
    logError('❌ Fehler bei Rollback:', error);
    throw error;
  }
}
