// src/app/api/km/mannschaften/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const KM_MANNSCHAFTEN_COLLECTION = 'km_mannschaften';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection(KM_MANNSCHAFTEN_COLLECTION).get();
    const mannschaften = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: mannschaften
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Mannschaften:', error);
    // Return empty array on error to prevent UI breaking
    return NextResponse.json({
      success: true,
      data: [],
      error: error.message
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
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection(KM_MANNSCHAFTEN_COLLECTION).add(mannschaft);

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