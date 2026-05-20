import { NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export async function POST() {
  try {
    logDebug('🧹 MIGRATION: Starte Schützen-Bereinigung...');
    
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    // 1. Lösche alle shooters
    const shootersSnapshot = await getDocs(collection(db, 'shooters'));
    logDebug(`📊 Gefunden: ${shootersSnapshot.size} shooters`);
    
    shootersSnapshot.docs.forEach(docSnap => {
      batch.delete(doc(db, 'shooters', docSnap.id));
      deletedCount++;
    });
    
    // 2. Lösche alle km_shooters
    const kmShootersSnapshot = await getDocs(collection(db, 'km_shooters'));
    logDebug(`📊 Gefunden: ${kmShootersSnapshot.size} km_shooters`);
    
    kmShootersSnapshot.docs.forEach(docSnap => {
      batch.delete(doc(db, 'km_shooters', docSnap.id));
      deletedCount++;
    });
    
    // 3. Batch ausführen
    await batch.commit();
    
    logDebug(`✅ MIGRATION: ${deletedCount} Schützen gelöscht`);
    
    return NextResponse.json({
      success: true,
      message: `Bereinigung abgeschlossen: ${deletedCount} Schützen gelöscht`,
      details: {
        shooters_deleted: shootersSnapshot.size,
        km_shooters_deleted: kmShootersSnapshot.size,
        total_deleted: deletedCount
      }
    });
    
  } catch (error) {
    logError('❌ MIGRATION ERROR:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}
