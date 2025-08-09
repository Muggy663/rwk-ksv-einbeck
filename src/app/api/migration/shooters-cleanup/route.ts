import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export async function POST() {
  try {
    console.log('🧹 MIGRATION: Starte Schützen-Bereinigung...');
    
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    // 1. Lösche alle rwk_shooters
    const rwkShootersSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    console.log(`📊 Gefunden: ${rwkShootersSnapshot.size} rwk_shooters`);
    
    rwkShootersSnapshot.docs.forEach(docSnap => {
      batch.delete(doc(db, 'rwk_shooters', docSnap.id));
      deletedCount++;
    });
    
    // 2. Lösche alle km_shooters
    const kmShootersSnapshot = await getDocs(collection(db, 'km_shooters'));
    console.log(`📊 Gefunden: ${kmShootersSnapshot.size} km_shooters`);
    
    kmShootersSnapshot.docs.forEach(docSnap => {
      batch.delete(doc(db, 'km_shooters', docSnap.id));
      deletedCount++;
    });
    
    // 3. Batch ausführen
    await batch.commit();
    
    console.log(`✅ MIGRATION: ${deletedCount} Schützen gelöscht`);
    
    return NextResponse.json({
      success: true,
      message: `Bereinigung abgeschlossen: ${deletedCount} Schützen gelöscht`,
      details: {
        rwk_shooters_deleted: rwkShootersSnapshot.size,
        km_shooters_deleted: kmShootersSnapshot.size,
        total_deleted: deletedCount
      }
    });
    
  } catch (error) {
    console.error('❌ MIGRATION ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}