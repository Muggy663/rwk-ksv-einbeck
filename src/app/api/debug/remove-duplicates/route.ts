import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function POST() {
  try {
    console.log('🔄 REMOVE DUPLICATES: Entferne Duplikate, behalte RWK-Teilnehmer...');
    
    // 1. Lade alle Schützen
    const shootersSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    const allShooters = shootersSnapshot.docs.map(doc => ({ 
      firestoreId: doc.id, 
      ...doc.data() 
    }));
    
    console.log('👥 Alle Schützen geladen:', allShooters.length);
    
    // 2. Gruppiere nach Namen (case-insensitive)
    const nameGroups = new Map();
    
    for (const shooter of allShooters) {
      const cleanName = shooter.name?.toLowerCase().trim();
      if (!cleanName) continue;
      
      if (!nameGroups.has(cleanName)) {
        nameGroups.set(cleanName, []);
      }
      nameGroups.get(cleanName).push(shooter);
    }
    
    // 3. Finde Duplikate und entscheide welche behalten werden
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    const toDelete = [];
    
    for (const [name, shooters] of nameGroups) {
      if (shooters.length > 1) {
        duplicatesFound++;
        console.log(`🔍 Duplikat gefunden: ${name} (${shooters.length}x)`);
        
        // Sortiere: RWK-Teilnehmer (clubId) zuerst, dann reconstructed, dann importierte
        shooters.sort((a, b) => {
          if (a.clubId && !b.clubId) return -1; // RWK zuerst
          if (!a.clubId && b.clubId) return 1;
          if (a.reconstructed && !b.reconstructed) return -1; // Rekonstruierte vor importierten
          if (!a.reconstructed && b.reconstructed) return 1;
          return 0;
        });
        
        // Behalte den ersten (besten), lösche den Rest
        const keep = shooters[0];
        const remove = shooters.slice(1);
        
        console.log(`✅ Behalte: ${keep.name} (${keep.clubId ? 'RWK' : keep.reconstructed ? 'Rekonstruiert' : 'Import'})`);
        
        for (const shooter of remove) {
          console.log(`❌ Lösche: ${shooter.name} (${shooter.clubId ? 'RWK' : shooter.reconstructed ? 'Rekonstruiert' : 'Import'})`);
          toDelete.push(shooter.firestoreId);
        }
      }
    }
    
    console.log(`📊 Duplikate gefunden: ${duplicatesFound}`);
    console.log(`🗑️ Zu löschende Dokumente: ${toDelete.length}`);
    
    // 4. Lösche Duplikate
    for (const firestoreId of toDelete) {
      try {
        await deleteDoc(doc(db, 'rwk_shooters', firestoreId));
        duplicatesRemoved++;
        
        if (duplicatesRemoved % 50 === 0) {
          console.log(`🗑️ Gelöscht: ${duplicatesRemoved}/${toDelete.length}`);
        }
      } catch (error) {
        console.error('❌ Fehler beim Löschen:', firestoreId, error);
      }
    }
    
    const finalCount = allShooters.length - duplicatesRemoved;
    
    return NextResponse.json({
      success: true,
      message: `${duplicatesRemoved} Duplikate entfernt. ${finalCount} Schützen verbleiben.`,
      details: {
        initial_count: allShooters.length,
        duplicates_found: duplicatesFound,
        duplicates_removed: duplicatesRemoved,
        final_count: finalCount
      }
    });
    
  } catch (error) {
    console.error('Duplicate removal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}