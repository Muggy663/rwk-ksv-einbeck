import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Korrigiere KV_KM_ORGA Rollen...');
    
    // Nur diese 2 Benutzer sollen KV_KM_ORGA behalten
    // stephanie.buenger@gmx.de hat bereits KV_WETTKAMPFLEITER (höhere Rolle)
    const keepKvKmOrga = [
      'test-orga@rwk-einbeck.de',
      'sportleitung-ksv-einbeck@web.de'
    ];
    
    // Alle Benutzer mit KV_KM_ORGA Rolle finden
    const usersSnapshot = await adminDb.collection('user_permissions').get();
    const batch = adminDb.batch();
    let processedCount = 0;
    let keptCount = 0;
    const log: string[] = [];
    
    log.push(`📊 Gefunden: ${usersSnapshot.size} Benutzer insgesamt`);
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const email = data.email;
      
      // Debug: Alle Benutzer und ihre kvRole/kvRoles anzeigen
      const hasKvKmOrgaNew = data.kvRole === 'KV_KM_ORGA';
      const hasKvKmOrgaOld = data.kvRoles && Object.values(data.kvRoles).includes('KV_KM_ORGA');
      log.push(`🔍 Debug: ${email} - kvRole: ${data.kvRole || 'KEINE'}, kvRoles: ${JSON.stringify(data.kvRoles || {})}`);
      
      // Prüfen ob Benutzer KV_KM_ORGA hat (neue oder alte Struktur)
      if (hasKvKmOrgaNew || hasKvKmOrgaOld) {
        log.push(`📧 Gefunden: ${email} mit KV_KM_ORGA`);
        
        if (keepKvKmOrga.includes(email)) {
          log.push(`🔄 ${email}: Upgrade KV_KM_ORGA → KV_WETTKAMPFLEITER`);
          
          // Upgrade zu KV_WETTKAMPFLEITER
          const upgradeData: any = {
            kvRole: 'KV_WETTKAMPFLEITER',
            updatedAt: FieldValue.serverTimestamp(),
            migrationNote: 'KV_KM_ORGA → KV_WETTKAMPFLEITER upgrade am ' + new Date().toISOString()
          };
          
          // Entferne alte kvRoles Struktur
          if (data.kvRoles) {
            upgradeData.kvRoles = FieldValue.delete();
          }
          
          batch.update(doc.ref, upgradeData);
          keptCount++;
        } else {
          log.push(`🔄 ${email}: Entferne KV_KM_ORGA, behält nur SPORTLEITER`);
          
          // KV_KM_ORGA entfernen, aber SPORTLEITER-Rolle behalten
          const updateData: any = {
            updatedAt: FieldValue.serverTimestamp(),
            migrationNote: 'KV_KM_ORGA entfernt am ' + new Date().toISOString() + ' - behält nur SPORTLEITER-Rolle'
          };
          
          // Entferne sowohl kvRole als auch kvRoles
          if (data.kvRole) {
            updateData.kvRole = FieldValue.delete();
          }
          if (data.kvRoles) {
            updateData.kvRoles = FieldValue.delete();
          }
          
          batch.update(doc.ref, updateData);
          processedCount++;
        }
      }
    }
    
    if (processedCount > 0) {
      log.push(`💾 Speichere ${processedCount} Änderungen...`);
      await batch.commit();
      log.push(`✅ ${processedCount} Benutzer-Rollen korrigiert`);
    } else {
      log.push('ℹ️ Keine Korrekturen erforderlich');
    }
    
    // Finale Übersicht
    log.push('\n📊 Finale KV_KM_ORGA Übersicht:');
    const finalSnapshot = await adminDb.collection('user_permissions')
      .where('kvRole', '==', 'KV_KM_ORGA')
      .get();
    
    const finalUsers: string[] = [];
    finalSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userInfo = `✅ ${data.email}: Hat KV_KM_ORGA`;
      log.push(userInfo);
      finalUsers.push(data.email);
    });
    
    log.push(`\n🎯 Ergebnis: ${finalSnapshot.size} Benutzer haben noch KV_KM_ORGA (sollten 0 sein)`);
    log.push(`📈 Statistik: ${keptCount} zu KV_WETTKAMPFLEITER upgraded, ${processedCount} entfernt`);
    
    return NextResponse.json({
      success: true,
      message: `KV_KM_ORGA Rollen korrigiert: ${processedCount} entfernt, ${keptCount} behalten`,
      stats: {
        totalProcessed: processedCount,
        totalKept: keptCount,
        finalKvKmOrgaCount: finalSnapshot.size,
        finalKvKmOrgaUsers: finalUsers
      },
      log: log
    });
    
  } catch (error: any) {
    console.error('❌ Fehler beim Korrigieren der KV_KM_ORGA Rollen:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'KV_KM_ORGA Rollen-Korrektur fehlgeschlagen'
    }, { status: 500 });
  }
}