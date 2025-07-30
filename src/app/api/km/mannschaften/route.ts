// src/app/api/km/mannschaften/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const KM_MANNSCHAFTEN_COLLECTION = 'km_mannschaften';

export async function GET(request: NextRequest) {
  try {
    console.log('Loading mannschaften...');
    const snapshot = await getDocs(collection(db, KM_MANNSCHAFTEN_COLLECTION));
    const mannschaften = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Found mannschaften:', mannschaften.length);
    return NextResponse.json({
      success: true,
      data: mannschaften
    });

  } catch (error) {
    console.error('Fehler beim Laden der Mannschaften:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      data: []
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vereinId, disziplinId, wettkampfklassen, schuetzenIds, name, saison } = body;

    const mannschaft = {
      vereinId,
      disziplinId,
      wettkampfklassen: wettkampfklassen || [],
      schuetzenIds: schuetzenIds || [],
      name: name || '',
      saison: saison || '2026',
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, KM_MANNSCHAFTEN_COLLECTION), mannschaft);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...mannschaft }
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Mannschaft:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`
    }, { status: 500 });
  }
}