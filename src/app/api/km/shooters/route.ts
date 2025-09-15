import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clubId = request.nextUrl.searchParams.get('clubId');
    
    let shootersQuery;
    if (clubId) {
      // Filtere nach clubId für Vereinsvertreter
      shootersQuery = adminDb.collection('shooters').where('clubId', '==', clubId);
    } else {
      // Alle Schützen für Admin
      shootersQuery = adminDb.collection('shooters');
    }
    
    const shootersSnap = await shootersQuery.get();
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
    const docRef = await adminDb.collection('shooters').add(shooterData);
    
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