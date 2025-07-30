import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🔍 Counting all collections...');
    
    // Zähle rwk_shooters
    const shootersSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    const allShooters = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Analysiere die Schützen
    const rwkShooters = allShooters.filter(s => s.clubId);
    const kmShooters = allShooters.filter(s => s.kmClubId && !s.clubId);
    
    // Suche nach Marcel und Stephanie
    const marcelBuenger = allShooters.find(s => 
      s.name && s.name.toLowerCase().includes('marcel') && s.name.toLowerCase().includes('bünger')
    );
    const stephanieBuenger = allShooters.find(s => 
      s.name && s.name.toLowerCase().includes('stephanie') && s.name.toLowerCase().includes('bünger')
    );
    
    const result = {
      rwk_shooters_total: allShooters.length,
      rwk_shooters_with_clubId: rwkShooters.length,
      km_shooters_only: kmShooters.length,
      marcel_buenger: marcelBuenger ? marcelBuenger.name : 'NICHT GEFUNDEN',
      stephanie_buenger: stephanieBuenger ? stephanieBuenger.name : 'NICHT GEFUNDEN',
      first_5_names: allShooters.map(s => s.name).sort().slice(0, 5),
      last_5_names: allShooters.map(s => s.name).sort().slice(-5)
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}