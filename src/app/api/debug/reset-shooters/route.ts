import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function POST() {
  try {
    console.log('🗑️ RESET: Lösche alle rwk_shooters...');
    
    // 1. Lade alle rwk_shooters
    const shootersSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    console.log('📊 Gefunden:', shootersSnapshot.docs.length, 'Schützen zum Löschen');
    
    // 2. Lösche alle Schützen
    let deleted = 0;
    for (const shooterDoc of shootersSnapshot.docs) {
      await deleteDoc(doc(db, 'rwk_shooters', shooterDoc.id));
      deleted++;
      if (deleted % 100 === 0) {
        console.log('🗑️ Gelöscht:', deleted, 'von', shootersSnapshot.docs.length);
      }
    }
    
    console.log('✅ RESET komplett:', deleted, 'Schützen gelöscht');
    
    return NextResponse.json({
      success: true,
      message: `${deleted} Schützen gelöscht. Collection ist jetzt leer.`,
      next_steps: [
        '1. Excel-Import ausführen (alle Schützen neu importieren)',
        '2. RWK-Verknüpfung ausführen (rwk_scores mit rwk_shooters verknüpfen)',
        '3. Fertig - alle Daten sollten wieder da sein'
      ]
    });
    
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}