import { NextResponse } from 'next/server';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST() {
  console.log('🔧 Starte automatische Duplikat-Reparatur...');
  
  try {
    const results = [];
    
    // 1. Repariere rwk_scores Duplikate
    console.log('\n📊 Repariere rwk_scores...');
    const scoresSnapshot = await getDocs(collection(db, 'rwk_scores'));
    const scores = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const scoresDuplicateMap = new Map();
    scores.forEach(score => {
      const key = `${score.shooterName}|${score.teamName}|${score.durchgang}|${score.seasonName}`;
      if (!scoresDuplicateMap.has(key)) scoresDuplicateMap.set(key, []);
      scoresDuplicateMap.get(key).push(score);
    });
    
    const scoresDuplicates = Array.from(scoresDuplicateMap.values()).filter(entries => entries.length > 1);
    
    for (const entries of scoresDuplicates) {
      const first = entries[0];
      console.log(`📝 Scores: ${first.shooterName} (${first.teamName}, DG${first.durchgang})`);
      
      const keepEntry = entries.reduce((latest, current) => {
        const latestTime = latest.entryTimestamp?.seconds || 0;
        const currentTime = current.entryTimestamp?.seconds || 0;
        return currentTime > latestTime ? current : latest;
      });
      
      const toDelete = entries.filter(e => e.id !== keepEntry.id);
      let deletedCount = 0;
      
      for (const entry of toDelete) {
        try {
          await deleteDoc(doc(db, 'rwk_scores', entry.id));
          console.log(`🗑️ Scores gelöscht: ${entry.id}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Fehler: ${entry.id}`, error);
        }
      }
      
      results.push({ name: first.shooterName, collection: 'rwk_scores', removed: deletedCount });
    }
    
    // 2. Finde Schützen mit gleichen Namen aber verschiedenen IDs
    console.log('\n👤 Suche Schützen-Duplikate...');
    const shootersSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    const shooters = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Bekannte Problemfälle
    const knownDuplicates = [
      { name: 'Jürgen Wauker', team: 'SV Lauenberg I' },
      { name: 'Jan Greve', team: 'LSV Lüthorst II' },
      { name: 'Detlef Christian', team: 'SV Markoldendorf II' }
    ];
    
    for (const duplicate of knownDuplicates) {
      console.log(`\n🔍 Suche: ${duplicate.name}`);
      
      // Finde alle Schützen mit diesem Namen
      const matchingShooters = shooters.filter(s => 
        s.name?.includes(duplicate.name) || 
        `${s.firstName} ${s.lastName}`.includes(duplicate.name)
      );
      
      if (matchingShooters.length > 1) {
        console.log(`📊 Gefunden: ${matchingShooters.length} Schützen mit Namen ${duplicate.name}`);
        
        // Behalte den besten Schützen (meiste Scores, bei Gleichstand neuester)
        let bestShooter = matchingShooters.reduce((best, current) => {
          const bestScores = scores.filter(s => s.shooterId === best.id);
          const currentScores = scores.filter(s => s.shooterId === current.id);
          
          console.log(`  - ${current.id}: ${currentScores.length} Scores`);
          
          // Mehr Scores = besser
          if (currentScores.length > bestScores.length) return current;
          if (currentScores.length < bestScores.length) return best;
          
          // Gleiche Anzahl Scores: Neuerer Schütze gewinnt
          const bestTime = best.createdAt?.seconds || 0;
          const currentTime = current.createdAt?.seconds || 0;
          return currentTime > bestTime ? current : best;
        });
        
        const bestScores = scores.filter(s => s.shooterId === bestShooter.id);
        
        console.log(`✅ Behalte Schütze: ${bestShooter.id} (${bestScores.length} Scores)`);
        
        // Lösche die anderen Schützen
        for (const shooter of matchingShooters) {
          if (shooter.id !== bestShooter.id) {
            try {
              await deleteDoc(doc(db, 'rwk_shooters', shooter.id));
              console.log(`🗑️ Schütze gelöscht: ${shooter.id}`);
              
              results.push({ 
                name: duplicate.name, 
                collection: 'rwk_shooters', 
                action: 'deleted_duplicate_shooter',
                removed: 1 
              });
            } catch (error) {
              console.error(`❌ Fehler beim Löschen Schütze ${shooter.id}:`, error);
            }
          }
        }
      }
    }
    
    console.log('\n🎉 Reparatur abgeschlossen!');
    return NextResponse.json({ success: true, results });
    
  } catch (error) {
    console.error('❌ Reparatur-Fehler:', error);
    return NextResponse.json({ 
      error: 'Fehler bei der Reparatur', 
      details: error.message 
    }, { status: 500 });
  }
}