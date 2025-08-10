import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(request: NextRequest) {
  try {
    const clubId = request.nextUrl.searchParams.get('clubId');
    
    let shootersQuery;
    if (clubId) {
      // Filtere nach clubId für Vereinsvertreter
      shootersQuery = query(collection(db, 'shooters'), where('clubId', '==', clubId));
    } else {
      // Alle Schützen für Admin
      shootersQuery = collection(db, 'shooters');
    }
    
    const shootersSnap = await getDocs(shootersQuery);
    const shooters = shootersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true, 
      data: shooters,
      count: shooters.length 
    });
  } catch (error) {
    console.error('KM Shooters API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch KM shooters' 
    }, { status: 500 });
  }
}
