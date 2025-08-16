import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  try {
    const shooterData = await request.json();
    
    // Add new shooter to Firestore
    const docRef = await addDoc(collection(db, 'shooters'), shooterData);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Shooter created successfully' 
    });
  } catch (error) {
    console.error('Create shooter error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create shooter' 
    }, { status: 500 });
  }
}
