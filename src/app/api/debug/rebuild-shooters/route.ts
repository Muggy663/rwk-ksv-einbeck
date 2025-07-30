import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function POST() {
  try {
    console.log('➕ ADD MISSING: Ergänze fehlende Schützen aus rwk_scores...');
    
    // 1. Lade bestehende rwk_shooters
    const existingShootersSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    const existingShooters = existingShootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const existingShooterIds = new Set(existingShooters.map(s => s.id));
    console.log('👥 Bestehende Schützen:', existingShooters.length);
    
    // 2. Lade alle rwk_scores
    const scoresSnapshot = await getDocs(collection(db, 'rwk_scores'));
    const allScores = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('📊 rwk_scores geladen:', allScores.length);
    
    // 3. Sammle NUR FEHLENDE Schützen aus den Scores
    const missingShootersMap = new Map();
    
    for (const score of allScores) {
      if (score.shooterId && score.shooterName && !existingShooterIds.has(score.shooterId)) {
        if (!missingShootersMap.has(score.shooterId)) {
          missingShootersMap.set(score.shooterId, {
            id: score.shooterId,
            name: score.shooterName,
            clubId: score.clubId,
            gender: score.shooterGender || 'unknown',
            teamIds: [],
            reconstructed: true,
            reconstructedAt: new Date(),
            source: 'rwk_scores'
          });
        }
      }
    }
    
    console.log('❌ Fehlende Schützen gefunden:', missingShootersMap.size);
    
    // 4. Erstelle NUR die fehlenden Schützen
    let created = 0;
    for (const [shooterId, shooterData] of missingShootersMap) {
      try {
        await addDoc(collection(db, 'rwk_shooters'), shooterData);
        created++;
        
        if (created % 50 === 0) {
          console.log('✅ Erstellt:', created, 'von', missingShootersMap.size);
        }
        
        // Debug: Marcel und Stephanie
        if (shooterData.name.toLowerCase().includes('marcel') && shooterData.name.toLowerCase().includes('bünger')) {
          console.log('🎯 Marcel Bünger rekonstruiert:', shooterData.name);
        }
        if (shooterData.name.toLowerCase().includes('stephanie') && shooterData.name.toLowerCase().includes('bünger')) {
          console.log('🎯 Stephanie Bünger rekonstruiert:', shooterData.name);
        }
      } catch (error) {
        console.error('Fehler bei:', shooterData.name, error);
      }
    }
    
    console.log('✅ REBUILD komplett:', created, 'Schützen rekonstruiert');
    
    return NextResponse.json({
      success: true,
      message: `${created} fehlende Schützen hinzugefügt (${existingShooters.length} waren bereits da)`,
      details: {
        existing_shooters: existingShooters.length,
        scores_processed: allScores.length,
        missing_shooters: missingShootersMap.size,
        shooters_added: created,
        total_after: existingShooters.length + created
      }
    });
    
  } catch (error) {
    console.error('Rebuild error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}